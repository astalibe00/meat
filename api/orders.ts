import {
  getInitialPaymentStatus,
  isOnlinePayment,
  ORDER_STATUS_LABELS,
} from "../src/lib/order-status.js";
import type {
  CustomerOrder,
  OrderLine,
  OrderStatus,
  OrderStatusEvent,
  PaymentMethod,
  PaymentStatus,
} from "../src/types/app-data.js";
import {
  appendAuditLog,
  mutateAppData,
  nextOrderId,
  nextStatusEventId,
  readAppData,
  replaceOrder,
  upsertCustomer,
} from "./_lib/app-data.js";
import { requireAdminRequest } from "./_lib/admin-auth.js";
import {
  getAdminChatIds,
  getChannelId,
  mainInlineKeyboard,
  orderActionKeyboard,
  sendMessage,
} from "./_lib/telegram.js";

interface ApiRequest {
  method?: string;
  body?: {
    action?: "cancel" | "status";
    orderId?: string;
    reason?: string;
    status?: OrderStatus;
    promoCode?: string;
    notes?: string;
    paymentMethod?: PaymentMethod;
    paymentReference?: string;
    telegramUserId?: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    customer?: {
      name?: string;
      phone?: string;
      address?: string;
      addressLabel?: string;
      coordinates?: { lat: number; lon: number };
      pickupPointId?: string;
      fulfillmentType?: "delivery" | "pickup";
    };
    items?: Array<{
      productId?: string;
      quantity?: number;
      weightOption?: string;
    }>;
  };
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

const FREE_SHIPPING_THRESHOLD = 900000;
const DELIVERY_FEE = 85000;
const P2P_PAYMENT_CARD = "9860350140942508";

function getRecipients() {
  return [...new Set([...getAdminChatIds(), getChannelId()].filter(Boolean))];
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("uz-UZ").format(Math.round(value))} UZS`;
}

function getRequestedKg(line: Pick<OrderLine, "quantity" | "weightOption" | "product">) {
  return Number(
    (
      line.quantity *
      Number((line.weightOption ?? line.product.weight).match(/(\d+(?:\.\d+)?)/g)?.slice(-1)[0] ?? "1")
    ).toFixed(2),
  );
}

function createStatusEvent(status: OrderStatus, label: string, source: OrderStatusEvent["source"]) {
  return {
    id: nextStatusEventId(),
    status,
    label,
    createdAt: new Date().toISOString(),
    source,
  };
}

function getStatusLabel(status: OrderStatus, order: CustomerOrder) {
  switch (status) {
    case "confirmed":
      return isOnlinePayment(order.paymentMethod)
        ? "To'lov tekshirildi va buyurtma tasdiqlandi."
        : "Buyurtma admin tomonidan tasdiqlandi.";
    case "preparing":
      return "Mahsulot tayyorlash boshlandi.";
    case "ready":
      return order.customer.fulfillmentType === "pickup"
        ? "Buyurtma tarqatish punktida tayyor."
        : "Buyurtma jo'natishga tayyor.";
    case "delivering":
      return order.customer.fulfillmentType === "pickup"
        ? "Buyurtma pickup punktida kutilmoqda."
        : "Buyurtma yetkazib berilmoqda.";
    case "completed":
      return "Buyurtma muvaffaqiyatli topshirildi.";
    case "cancelled":
      return "Buyurtma bekor qilindi.";
    case "pending":
    default:
      return isOnlinePayment(order.paymentMethod)
        ? "P2P to'lov tekshiruvini kutmoqda."
        : "Buyurtma admin tasdig'iga yuborildi.";
  }
}

function summarizeOrder(order: CustomerOrder) {
  return [
    `Buyurtma: ${order.id}`,
    `Mijoz: ${order.customer.name}`,
    order.customer.phone ? `Telefon: ${order.customer.phone}` : "",
    order.customer.fulfillmentType === "pickup"
      ? `Tarqatish punkti: ${order.customer.pickupPointId ?? "-"}`
      : `Manzil: ${order.customer.address ?? "-"}`,
    `Holat: ${ORDER_STATUS_LABELS[order.status]}`,
    `To'lov turi: ${order.paymentMethod.toUpperCase()}`,
    `To'lov holati: ${order.paymentStatus}`,
    order.paymentReference ? `Tranzaksiya: ${order.paymentReference}` : "",
    isOnlinePayment(order.paymentMethod) ? `P2P karta: ${order.paymentCardNumber ?? P2P_PAYMENT_CARD}` : "",
    "",
    "Mahsulotlar:",
    ...order.items.map(
      (item) =>
        `- ${item.quantity} x ${item.product.name} (${item.weightOption ?? item.product.weight}) - ${formatMoney(item.product.price * item.quantity)}`,
    ),
    "",
    `Jami: ${formatMoney(order.total)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function resolvePaymentStatus(status: OrderStatus, order: CustomerOrder): PaymentStatus {
  if (status === "cancelled") {
    return isOnlinePayment(order.paymentMethod) ? "refund-pending" : "cancelled";
  }

  if (
    isOnlinePayment(order.paymentMethod) &&
    (status === "confirmed" || status === "preparing" || status === "ready" || status === "delivering" || status === "completed")
  ) {
    return "paid";
  }

  if (status === "completed") {
    return "paid";
  }

  return order.paymentStatus;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method === "POST") {
      const payload = req.body ?? {};
      if (!payload.items?.length || !payload.customer?.name || !payload.paymentMethod) {
        res.status(400).json({ ok: false, error: "Buyurtma ma'lumotlari yetarli emas" });
        return;
      }

      const nextState = await mutateAppData((state) => {
        const items: OrderLine[] = [];

        for (const item of payload.items ?? []) {
          const product = state.products.find((entry) => entry.id === item.productId);
          if (!product || !item.quantity || item.quantity <= 0) {
            continue;
          }

          items.push({
            product,
            quantity: item.quantity,
            weightOption: item.weightOption || product.weight,
          });
        }

        if (!items.length) {
          throw new Error("Mahsulotlar topilmadi.");
        }

        for (const line of items) {
          if (getRequestedKg(line) > line.product.stockKg) {
            throw new Error(
              `${line.product.name} uchun omborda yetarli qoldiq yo'q. Katta buyurtmalar uchun +998990197548 raqamiga qo'ng'iroq qiling.`,
            );
          }
        }

        const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const savings = items.reduce(
          (sum, item) => sum + ((item.product.oldPrice ?? item.product.price) - item.product.price) * item.quantity,
          0,
        );
        const delivery =
          payload.customer?.fulfillmentType === "pickup"
            ? 0
            : subtotal >= FREE_SHIPPING_THRESHOLD
              ? 0
              : DELIVERY_FEE;
        const paymentStatus = getInitialPaymentStatus(payload.paymentMethod);
        const status: OrderStatus = "pending";

        const order: CustomerOrder = {
          id: nextOrderId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items,
          subtotal,
          savings,
          promoDiscount: 0,
          delivery,
          total: subtotal + delivery,
          promoCode: payload.promoCode?.trim() ?? "",
          customer: {
            telegramUserId: payload.telegramUserId,
            name: payload.customer?.name?.trim() || "Mijoz",
            username: payload.username,
            phone: payload.customer?.phone?.trim(),
            address: payload.customer?.address?.trim(),
            addressLabel: payload.customer?.addressLabel?.trim(),
            coordinates: payload.customer?.coordinates,
            pickupPointId: payload.customer?.pickupPointId?.trim(),
            fulfillmentType: payload.customer?.fulfillmentType ?? "delivery",
            notes: payload.notes?.trim(),
          },
          paymentMethod: payload.paymentMethod,
          paymentStatus,
          paymentCardNumber: isOnlinePayment(payload.paymentMethod) ? P2P_PAYMENT_CARD : undefined,
          paymentReference: payload.paymentReference?.trim(),
          status,
          statusHistory: [],
        };

        order.statusHistory = [
          createStatusEvent(status, getStatusLabel(status, order), "system"),
        ];

        return {
          ...state,
          customers: payload.telegramUserId
            ? upsertCustomer(state.customers, {
                telegramUserId: payload.telegramUserId,
                name: order.customer.name,
                username: payload.username,
                phone: order.customer.phone,
                address: order.customer.address,
                addressLabel: order.customer.addressLabel,
                coordinates: order.customer.coordinates,
                preferredFulfillment: order.customer.fulfillmentType,
                pickupPointId: order.customer.pickupPointId,
              })
            : state.customers,
          orders: [order, ...state.orders],
          products: state.products.map((product) => {
            const line = items.find((entry) => entry.product.id === product.id);
            if (!line) {
              return product;
            }

            return {
              ...product,
              stockKg: Math.max(0, Number((product.stockKg - getRequestedKg(line)).toFixed(2))),
            };
          }),
          auditLog: appendAuditLog(state.auditLog, {
            actor: payload.telegramUserId ? `telegram:${payload.telegramUserId}` : "customer",
            action: "order.created",
            entityType: "order",
            entityId: order.id,
            summary: `${order.id} buyurtmasi yaratildi. Jami: ${formatMoney(order.total)}.`,
          }),
        };
      });

      const order = nextState.orders[0];
      const recipients = getRecipients();
      await Promise.all(
        recipients.map((chatId) =>
          sendMessage(chatId, `Yangi buyurtma\n\n${summarizeOrder(order)}`, {
            reply_markup: orderActionKeyboard(order.id),
          }),
        ),
      );

      if (order.customer.telegramUserId) {
        await sendMessage(
          order.customer.telegramUserId,
          isOnlinePayment(order.paymentMethod)
            ? `Buyurtmangiz yaratildi. P2P to'lovni ${P2P_PAYMENT_CARD} kartaga o'tkazing va admin tasdig'ini kuting.\n\n${summarizeOrder(order)}`
            : `Buyurtmangiz yaratildi va admin tasdig'iga yuborildi.\n\n${summarizeOrder(order)}`,
          { reply_markup: mainInlineKeyboard() },
        );
      }

      res.status(200).json({ ok: true, order });
      return;
    }

    if (req.method === "PATCH") {
      const payload = req.body ?? {};
      if (!payload.orderId || !payload.action) {
        res.status(400).json({ ok: false, error: "Order action is required" });
        return;
      }

      const isAdminAction = payload.action === "status";
      if (isAdminAction) {
        await requireAdminRequest(req);
      }

      let updatedOrder: CustomerOrder | undefined;
      const nextState = await mutateAppData((state) => {
        const order = state.orders.find((item) => item.id === payload.orderId);
        if (!order) {
          throw new Error("Buyurtma topilmadi.");
        }

        let status = order.status;
        let paymentStatus = order.paymentStatus;
        let cancellationReason = order.cancellationReason;
        let paymentConfirmedAt = order.paymentConfirmedAt;

        if (payload.action === "cancel") {
          status = "cancelled";
          paymentStatus = resolvePaymentStatus(status, order);
          cancellationReason = payload.reason?.trim() || "Mijoz tomonidan bekor qilindi.";
        }

        if (payload.action === "status") {
          if (!payload.status) {
            throw new Error("Yangi status kerak.");
          }

          status = payload.status;
          paymentStatus = resolvePaymentStatus(status, order);
          if (paymentStatus === "paid") {
            paymentConfirmedAt = new Date().toISOString();
          }
        }

        updatedOrder = {
          ...order,
          status,
          paymentStatus,
          paymentConfirmedAt,
          cancellationReason,
          updatedAt: new Date().toISOString(),
          statusHistory: [
            ...order.statusHistory,
            createStatusEvent(
              status,
              payload.action === "cancel"
                ? cancellationReason || getStatusLabel(status, order)
                : getStatusLabel(status, { ...order, status, paymentStatus }),
              payload.action === "status" ? "admin" : "customer",
            ),
          ],
        };

        return {
          ...state,
          orders: replaceOrder(state.orders, updatedOrder),
          auditLog: appendAuditLog(state.auditLog, {
            actor:
              payload.action === "status"
                ? "admin-panel"
                : updatedOrder.customer.telegramUserId
                  ? `telegram:${updatedOrder.customer.telegramUserId}`
                  : "customer",
            actorRole: payload.action === "status" ? "owner" : undefined,
            action: payload.action === "status" ? "order.status-updated" : "order.cancelled",
            entityType: "order",
            entityId: updatedOrder.id,
            summary:
              payload.action === "status"
                ? `${updatedOrder.id} holati ${ORDER_STATUS_LABELS[updatedOrder.status]} ga o'tkazildi.`
                : `${updatedOrder.id} buyurtmasi bekor qilindi.`,
          }),
        };
      });

      if (!updatedOrder) {
        res.status(500).json({ ok: false, error: "Buyurtma yangilanmadi." });
        return;
      }

      const recipients = getRecipients();
      await Promise.all(
        recipients.map((chatId) =>
          sendMessage(chatId, `Buyurtma yangilandi\n\n${summarizeOrder(updatedOrder!)}`, {
            reply_markup: orderActionKeyboard(updatedOrder!.id),
          }),
        ),
      );

      if (updatedOrder.customer.telegramUserId) {
        await sendMessage(
          updatedOrder.customer.telegramUserId,
          `Buyurtma holati yangilandi: ${ORDER_STATUS_LABELS[updatedOrder.status]}\n\n${summarizeOrder(updatedOrder)}`,
          { reply_markup: mainInlineKeyboard() },
        );
      }

      res.status(200).json({ ok: true, order: updatedOrder, orders: nextState.orders });
      return;
    }

    if (req.method === "GET") {
      const telegramUserId = Number(req.query?.telegramUserId ?? 0) || undefined;

      try {
        await requireAdminRequest(req);
        const state = await readAppData();
        res.status(200).json({ ok: true, orders: state.orders });
        return;
      } catch {
        if (!telegramUserId) {
          res.status(200).json({ ok: true, orders: [] });
          return;
        }

        const state = await readAppData();
        res.status(200).json({
          ok: true,
          orders: state.orders.filter((order) => order.customer.telegramUserId === telegramUserId),
        });
        return;
      }
    }

    res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (error) {
    console.error("[orders] failed", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Order request failed",
    });
  }
}
