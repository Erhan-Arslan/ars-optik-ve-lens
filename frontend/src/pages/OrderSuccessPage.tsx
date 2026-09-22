import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart";

export function OrderSuccessPage() {
  const { orderNumber } = useParams();
  const clear = useCartStore((s) => s.clear);

  // The order was already created server-side by the time this page mounts —
  // clearing here (rather than from the checkout submit handler) avoids a
  // navigation race with CheckoutPage's own "empty cart" redirect guard.
  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-100 text-bronze-600"
      >
        <CheckCircle2 size={40} />
      </motion.div>
      <h1 className="mt-6 font-display text-3xl text-ink-900">Siparişiniz Alındı</h1>
      <p className="mt-3 text-ink-500">
        Sipariş numaranız <span className="font-semibold text-ink-800">#{orderNumber}</span>. Sipariş
        detaylarını e-posta adresinize gönderdik.
      </p>
      <Link to="/katalog" className={buttonVariants({ className: "mt-8" })}>
        Alışverişe Devam Et
      </Link>
    </div>
  );
}
