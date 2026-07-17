import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import type { CartItem } from '../../store/cartStore';

interface CartItemComponentProps {
  item: CartItem;
  onRemove: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
}

const formatPrice = (p: number) =>
  (p ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

/** CartItemComponent — Một dòng sản phẩm trong giỏ: ảnh, tên, tăng/giảm số lượng, xóa. */
export const CartItemComponent: React.FC<CartItemComponentProps> = ({
  item,
  onRemove,
  onUpdateQuantity,
}) => {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-0 dark:border-slate-800">
      {/* Ảnh */}
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
        {item.productImage && (
          <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
        )}
      </div>

      {/* Thông tin */}
      <div className="min-w-0 flex-grow">
        <h3 className="truncate font-semibold text-slate-900 dark:text-white">{item.productName}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatPrice(item.unitPrice)}</p>
      </div>

      {/* Số lượng */}
      <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-2 py-1 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          className="rounded p-1 text-slate-600 transition hover:bg-slate-200 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
          disabled={item.quantity <= 1}
        >
          <Minus size={16} />
        </button>
        <span className="w-8 text-center font-medium text-slate-900 dark:text-white">{item.quantity}</span>
        <button
          type="button"
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          className="rounded p-1 text-slate-600 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Thành tiền */}
      <div className="min-w-max text-right">
        <p className="font-semibold text-slate-900 dark:text-white">{formatPrice(item.subtotal)}</p>
      </div>

      {/* Xóa */}
      <button
        type="button"
        onClick={() => onRemove(item.productId)}
        className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-900/20"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};
