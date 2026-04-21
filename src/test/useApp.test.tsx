import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PRODUCTS } from "@/data/products";
import { CartScreen } from "@/screens/CartScreen";
import { CategoriesScreen } from "@/screens/CategoriesScreen";
import { CheckoutScreen } from "@/screens/CheckoutScreen";
import { ProductDetailScreen } from "@/screens/ProductDetailScreen";
import { SearchScreen } from "@/screens/SearchScreen";
import { useApp } from "@/store/useApp";
import type { ManagedProduct } from "@/types/app-data";

const initialState = useApp.getInitialState();

function toManagedProduct(index = 0): ManagedProduct {
  const product = PRODUCTS[index];
  return {
    ...product,
    stockKg: 20,
    minOrderKg: 0.3,
    enabled: true,
    rating: 4.8,
    reviewCount: 0,
  };
}

function resetStore() {
  window.localStorage.clear();
  useApp.setState(initialState, true);
}

function seedCartAndCheckout() {
  const product = toManagedProduct();

  useApp.setState(
    {
      ...initialState,
      products: [product],
      pickupPoints: [
        {
          id: "pickup-1",
          title: "Yunusobod punkti",
          address: "Yunusobod tumani",
          landmark: "Metro yonida",
          hours: "09:00 - 21:00",
        },
      ],
      cart: [{ product, quantity: 1, weightOption: product.weightOptions?.[0] ?? product.weight }],
      checkout: {
        ...initialState.checkout,
        name: "Test mijoz",
        phone: "+998901234567",
        address: "Yunusobod tumani, 14-kvartal",
        addressLabel: "Uy",
        paymentMethod: "click",
      },
    },
    true,
  );

  return product;
}

describe("mini app state flows", () => {
  beforeEach(() => {
    resetStore();
    vi.restoreAllMocks();
  });

  it("updates cart quantity and removes items from the cart screen", () => {
    seedCartAndCheckout();

    render(<CartScreen />);

    fireEvent.click(screen.getByLabelText("Ko'paytirish"));
    expect(useApp.getState().cart[0]?.quantity).toBe(2);

    fireEvent.click(screen.getByLabelText("Olib tashlash"));
    expect(useApp.getState().cart).toHaveLength(0);
    expect(screen.getByText("Savatingiz hozircha bo'sh")).toBeInTheDocument();
  });

  it("switches from delivery to pickup and stores the pickup point", () => {
    seedCartAndCheckout();

    render(<CheckoutScreen />);

    fireEvent.click(screen.getByRole("button", { name: /Tarqatish punkti/i }));
    fireEvent.click(screen.getByRole("button", { name: /Yunusobod punkti/i }));

    expect(useApp.getState().checkout.fulfillmentType).toBe("pickup");
    expect(useApp.getState().checkout.pickupPointId).toBe("pickup-1");
  });

  it("keeps a custom address while the user edits delivery details", () => {
    seedCartAndCheckout();

    render(<CheckoutScreen />);

    const addressInput = screen.getByPlaceholderText(
      "Masalan: Yunusobod tumani, 14-kvartal, 23-uy",
    );
    const customAddress = "Chilonzor tumani, 19-kvartal, 12-uy";

    fireEvent.change(addressInput, { target: { value: customAddress } });

    expect(useApp.getState().checkout.address).toBe(customAddress);
  });

  it("rehydrates checkout details with a persisted custom address", async () => {
    const customAddress = "Yakkasaroy tumani, Shota Rustaveli ko'chasi, 55-uy";

    window.localStorage.setItem(
      "fresh-halal-direct-state",
      JSON.stringify({
        state: {
          checkout: {
            ...initialState.checkout,
            address: customAddress,
            addressLabel: "Ofis",
            paymentMethod: "payme",
          },
        },
        version: 3,
      }),
    );

    await useApp.persist.rehydrate();

    expect(useApp.getState().checkout.address).toBe(customAddress);
    expect(useApp.getState().checkout.addressLabel).toBe("Ofis");
    expect(useApp.getState().checkout.paymentMethod).toBe("payme");
  });

  it("renders categories without entering a zustand selector loop", () => {
    const product = toManagedProduct();

    useApp.setState(
      {
        ...initialState,
        screen: { name: "categories" },
        products: [product],
      },
      true,
    );

    render(<CategoriesScreen />);

    expect(screen.getByText("Katalog")).toBeInTheDocument();
    expect(screen.getByText(product.name)).toBeInTheDocument();
  });

  it("renders search recommendations without crashing", () => {
    const product = toManagedProduct();

    useApp.setState(
      {
        ...initialState,
        screen: { name: "search" },
        products: [product],
      },
      true,
    );

    render(<SearchScreen />);

    expect(screen.getByText("Qidiruv")).toBeInTheDocument();
    expect(
      screen.getByText((text) =>
        text === "Tavsiya etilgan mahsulotlar" || text === "Siz uchun tavsiyalar",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(product.name)).toBeInTheDocument();
  });

  it("renders product detail without entering a selector loop", () => {
    const product = toManagedProduct();

    useApp.setState(
      {
        ...initialState,
        screen: { name: "product", id: product.id },
        products: [product],
      },
      true,
    );

    render(<ProductDetailScreen />);

    expect(screen.getByText(product.name)).toBeInTheDocument();
    expect(screen.getByText("Mahsulot haqida")).toBeInTheDocument();
  });
});
