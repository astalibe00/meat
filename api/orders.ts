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
  mutateAppData,
  nextOrderId,
  nextStatusEventId,
  replaceOrder,
  upsertCustomer,
} from "./_lib/app-data.js";
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
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

const FREE_SHIPPING_THRESHOLD = 900000;
const DELIVERY_FEE = 85000;

function getRecipients() {
  return [...new Set([...getAdminChatIds(), getChannelId()].filter(Boolean))];
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("uz-UZ").format(Math.round(value))} UZS`;
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
      return "Admin buyurtmani tasdiqladi.";
    case "preparing":
      return isOnlinePayment(order.paymentMethod)
        ? "Online to'lov qabul qilindi, tayyorlash boshlandi."
        : "Mahsulot tayyorlash boshlandi.";
    case "ready":
      return order.customer.fulfillmentType === "pickup"
        ? "Buyurtma tarqatish punktida tayyor."
        : "Buyurtma jo'natishga tayyor.";
    case "delivering":
      return order.customer.fulfillmentType === "pickup"
        ? "Buyurtma pickup uchun kutilmoqda."
        : "Buyurtma yetkazib berilmoqda.";
    case "completed":
      return "Buyurtma muvaffaqiyatli topshirildi.";
    case "cancelled":
      return "Buyurtma bekor qilindi.";
    case "pending":
    default:
      return "Buyurtma admin tasdig'iga yuborildi.";
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
    `To'lov: ${order.paymentMethod.toUpperCase()}`,
    `Holat: ${ORDER_STATUS_LABELS[order.status]}`,
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
          const requestedKg = Number((line.quantity * Number((line.weightOption ?? line.product.weight).match(/(\d+(?:\.\d+)?)/g)?.slice(-1)[0] ?? "1")).toFixed(2));
          if (requestedKg > line.product.stockKg) {
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
        const status: OrderStatus = isOnlinePayment(payload.paymentMethod) ? "preparing" : "pending";
        const statusHistory = [createStatusEvent(status, getStatusLabel(status, {
          id: "",
          createdAt: "",
          updatedAt: "",
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
          status,
          statusHistory: [],
        } as CustomerOrder), "system")];
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
          status,
          statusHistory,
        };

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

            const requestedKg = Number((line.quantity * Number((line.weightOption ?? line.product.weight).match(/(\d+(?:\.\d+)?)/g)?.slice(-1)[0] ?? "1")).toFixed(2));
            return {
              ...product,
              stockKg: Math.max(0, Number((product.stockKg - requestedKg).toFixed(2))),
            };
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
          `Buyurtmangiz qabul qilindi.\n\n${summarizeOrder(order)}`,
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

      let updatedOrder: CustomerOrder | undefined;
      const nextState = await mutateAppData((state) => {
        const order = state.orders.find((item) => item.id === payload.orderId);
        if (!order) {
          throw new Error("Buyurtma topilmadi.");
        }

        let status = order.status;
        let paymentStatus = order.paymentStatus;
        let cancellationReason = order.cancellationReason;

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
        }

        updatedOrder = {
          ...order,
          status,
          paymentStatus,
          cancellationReason,
          updatedAt: new Date().toISOString(),
          statusHistory: [
            ...order.statusHistory,
            createStatusEvent(
              status,
              payload.action === "cancel"
                ? cancellationReason || getStatusLabel(status, order)
                : getStatusLabel(status, order),
              payload.action === "status" ? "admin" : "customer",
            ),
          ],
        };

        return {
          ...state,
          orders: replaceOrder(state.orders, updatedOrder),
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
      res.status(200).json({ ok: true });
      return;
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
