import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PRODUCTS } from "@/data/products";
import { CartScreen } from "@/screens/CartScreen";
import { CheckoutScreen } from "@/screens/CheckoutScreen";
import { DEFAULT_ADDRESSES, useApp } from "@/store/useApp";

const initialState = useApp.getInitialState();

function resetStore() {
  window.localStorage.clear();
  useApp.setState(initialState, true);
}

function seedCartAndCheckout() {
  const product = PRODUCTS[0];

  useApp.setState(
    {
      ...initialState,
      cart: [{ product, quantity: 1, weightOption: product.weightOptions?.[0] }],
      savedAddresses: DEFAULT_ADDRESSES,
      checkout: {
        ...initialState.checkout,
        addressId: DEFAULT_ADDRESSES[0].id,
        address: DEFAULT_ADDRESSES[0].address,
      },
    },
    true,
  );

  return product;
}

describe("mini app state flows", () => {
  beforeEach(() => {
    resetStore();
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

  it("selects a saved address and writes it into checkout", () => {
    seedCartAndCheckout();

    render(<CheckoutScreen />);

    fireEvent.click(screen.getByRole("button", { name: /Ofis/i }));

    expect(useApp.getState().checkout.addressId).toBe("office");
    expect(useApp.getState().checkout.address).toContain("Oybek ko'chasi");
  });

  it("keeps a custom address and label while the user edits delivery details", () => {
    seedCartAndCheckout();

    render(<CheckoutScreen />);

    const labelInput = screen.getByPlaceholderText("Masalan: Uy, Ofis, Ota-ona uyi");
    const addressInput = screen.getByPlaceholderText("Ko'cha, uy, kirish, qavat, mo'ljal");
    const customAddress = "Chilonzor tumani, 19-kvartal, 12-uy";

    fireEvent.change(labelInput, { target: { value: "Dacha" } });
    fireEvent.change(addressInput, { target: { value: customAddress } });

    expect(useApp.getState().checkout.addressId).toBe("");
    expect(useApp.getState().checkout.address).toBe(customAddress);
    expect((labelInput as HTMLInputElement).value).toBe("Dacha");
  });

  it("rehydrates a custom address without snapping back to the default saved address", async () => {
    const customAddress = "Yakkasaroy tumani, Shota Rustaveli ko'chasi, 55-uy";

    window.localStorage.setItem(
      "fresh-halal-direct-state",
      JSON.stringify({
        state: {
          savedAddresses: DEFAULT_ADDRESSES,
          checkout: {
            ...initialState.checkout,
            addressId: "",
            address: customAddress,
          },
        },
        version: 2,
      }),
    );

    await useApp.persist.rehydrate();

    expect(useApp.getState().checkout.addressId).toBe("saved-current");
    expect(useApp.getState().checkout.address).toBe(customAddress);
  });
});
