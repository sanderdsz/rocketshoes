import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart]
      const hasProduct = newCart.find(product => product.id === productId);

      const promise = await api.get(`/stock/${productId}`);
      const stockAmount = promise.data.amount;

      const currentAmount = hasProduct ? hasProduct.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (hasProduct) {
        hasProduct.amount = amount;
      } else {
        const promise = await api.get(`/products/${productId}`);
        const newProduct = {
          ...promise.data,
          amount: 1
        }
        newCart.push(newProduct)
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const currentCart = [...cart];
      const index = currentCart.findIndex(product => product.id === productId);

      if (index !== 0 && index > 0) {
        currentCart.splice(index, 1);
        setCart(currentCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(currentCart));
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    // const productPromise = await api.get(`/products/${productId}`);

    try {
      if (amount <= 0) {
        return
      }

      const stockPromise = await api.get(`/stock/${productId}`);
      const stockAmount = stockPromise.data.amount;
      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const currentCart = [...cart]
      const hasProduct = currentCart.find(product => product.id === productId);
      if (hasProduct) {
        hasProduct.amount = amount;
        setCart(currentCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(currentCart));
      } else {
        toast.error('Erro na alteração de quantidade do produto');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
