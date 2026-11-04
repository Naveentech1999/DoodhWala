export type Company = 'Heritage' | 'Vijaya' | 'Amul' | 'Jersey';
export type DeliveryStatus = 'delivered' | 'not_delivered';
export type Product = {
  id: string;
  company: Company;
  name: string;
  unit: 'litre' | 'packet';
  mrp: number;
};
export type Customer = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  active: boolean;
};
export type DeliveryLine = {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  status: DeliveryStatus;
  price: number;
};