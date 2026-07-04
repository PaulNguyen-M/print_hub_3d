import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import type { CartItem } from '../../store/cartStore';

interface CartItemComponentProps {
  item: CartItem;
  onRemove: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
}

export const CartItemComponent: React.FC<CartItemComponentProps> = ({
  item,
  onRemove,
  onUpdateQuantity,
}) => {
  return (
    <div className="flex items-center gap-4 py-4 border-b">
      {/* Product Image */}
      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
        {item.productImage && (
          <img
            src={item.productImage}
            alt={item.productName}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Product Info */}
      <div className="flex-grow">
        <h3 className="font-semibold text-gray-900">{item.productName}</h3>
        <p className="text-gray-600 text-sm mt-1">
          ${item.unitPrice.toFixed(2)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          className="p-1 hover:bg-gray-200 rounded transition"
          disabled={item.quantity <= 1}
        >
          <Minus size={16} />
        </button>
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          className="p-1 hover:bg-gray-200 rounded transition"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right min-w-max">
        <p className="font-semibold text-gray-900">
          ${item.subtotal.toFixed(2)}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(item.productId)}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};
