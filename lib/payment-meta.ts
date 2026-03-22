export const DEFAULT_PAYMENT_CATEGORY_NAMES = ["등록비", "월납부", "교재비"] as const;

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ko-KR").format(amount);
}

export function formatPaymentMonth(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return value;
  }

  const [year, month] = value.split("-");
  return `${year}년 ${Number(month)}월`;
}
