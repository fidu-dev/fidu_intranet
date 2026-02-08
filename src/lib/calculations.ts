import { SimulatedProduct } from "@/components/CartContext";

export interface CartTotals {
    total: number;
    commission: number;
    net: number;
}

/**
 * Calculates total sale amount, commission, and net amount for the cart.
 */
export function calculateCartTotals(
    selectedProducts: SimulatedProduct[],
    commissionRate: number
): CartTotals {
    if (selectedProducts.length === 0) {
        return { total: 0, commission: 0, net: 0 };
    }

    let total = 0;
    selectedProducts.forEach((product) => {
        // We use salePrice fields which are already mapped to the active season in ProductGrid
        total +=
            product.adults * product.salePriceAdulto +
            product.children * product.salePriceMenor +
            product.infants * product.salePriceBebe;
    });

    const commission = Math.round(total * commissionRate * 100) / 100;
    const net = Math.round((total - commission) * 100) / 100;

    return { total, commission, net };
}

/**
 * Formats a number as Brazilian Real currency.
 */
export const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
};
