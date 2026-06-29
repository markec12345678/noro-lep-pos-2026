import { useFetchOrderItems } from "@/services/orderItemsService";
import { useFetchFiscalInvoiceForOrder } from "@/services/fiscalService";
import { useFetchFiscalConfig } from "@/services/fiscalService";
import { Order, OrderItemStatus } from "@/types";
import { computeTaxBreakdown, computeSubtotal, computeTotalTax } from "@/lib/helper";
import OrderItemsLoop from "./OrderItemsLoop";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

/**
 * Printable receipt for an order.
 *
 * Layout follows Slovenian fiscal receipt requirements:
 *   - Restaurant name + address (header)
 *   - Tax number
 *   - Invoice number + business unit + device ID
 *   - Issue date/time
 *   - Itemized list (qty, name, unit price, line total)
 *   - Tax breakdown per rate (DDV 22%, 9.5%, 0%)
 *   - Subtotal / tax / total
 *   - ZOI (26 chars)
 *   - EOR (36 chars) — if submitted to FURS
 *   - QR code (FURS-mandated format)
 *
 * The receipt is rendered in an invisible div (visible only when printing)
 * so it doesn't affect the on-screen UI but can be sent to a printer via
 * window.print() with a print stylesheet.
 */
const PrintOrderDetails = ({ order }: { order: Order }) => {
  const {
    data: orderItems,
    isLoading,
    error,
  } = useFetchOrderItems(order?._id, true);
  const { data: fiscalInvoices } = useFetchFiscalInvoiceForOrder(order?._id);
  const { data: fiscalConfigs } = useFetchFiscalConfig();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const fiscalInvoice = fiscalInvoices?.[0];
  const fiscalConfig = fiscalConfigs?.[0];

  const items = orderItems ?? [];
  const taxBreakdown = computeTaxBreakdown(items);
  const subtotal = computeSubtotal(items);
  const totalTax = computeTotalTax(taxBreakdown);

  const issueDate = fiscalInvoice
    ? new Date(fiscalInvoice.issuedAt * 1000).toLocaleString("sl-SI", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : order?._created
      ? new Date(order._created * 1000).toLocaleString("sl-SI")
      : new Date().toLocaleString("sl-SI");

  return (
    <div className="print-box w-0 h-0 invisible opacity-0 bg-white">
      <div className="max-w-[400px] w-full p-4 receipt-content">
        {/* Header — restaurant info */}
        {fiscalConfig && (
          <>
            <h2 className="text-center font-bold text-xl my-2">
              {fiscalConfig.restaurantName || "POS"}
            </h2>
            {fiscalConfig.restaurantAddress && (
              <p className="text-center text-xs">
                {fiscalConfig.restaurantAddress}
              </p>
            )}
            <p className="text-center text-xs">
              Davčna št.: {fiscalConfig.taxNumber}
            </p>
            <hr className="my-3 border-dashed" />
          </>
        )}

        {!fiscalConfig && (
          <>
            <h2 className="text-center font-bold text-xl my-4">Noro Lep POS</h2>
            <hr className="my-4" />
          </>
        )}

        {/* Invoice metadata */}
        {fiscalInvoice && (
          <div className="mb-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Račun št.:</span>
              <span>
                {fiscalInvoice.businessUnit}-
                {fiscalInvoice.electronicDevice}-
                {fiscalInvoice.invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Datum:</span>
              <span>{issueDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Način plačila:</span>
              <span>
                {fiscalInvoice.paymentMethod === "cash"
                  ? "Gotovina"
                  : fiscalInvoice.paymentMethod === "card"
                    ? "Kartica"
                    : "Drugo"}
              </span>
            </div>
          </div>
        )}

        {!fiscalInvoice && (
          <div className="mb-4 text-sm">ID: {order?._id}</div>
        )}

        <hr className="my-3 border-dashed" />

        {/* Items */}
        <OrderItemsLoop orderItems={orderItems} />

        <hr className="my-3 border-dashed" />

        {/* Totals */}
        <div className="text-sm">
          <div className="flex justify-between w-full mt-2">
            <span>Medznaroni znesek:</span>
            <span className="font-mono">{formatCurrency(subtotal)}</span>
          </div>

          {/* Tax breakdown per rate */}
          {taxBreakdown.map((entry) => (
            <div
              key={`print-tax-${entry.rate}`}
              className="flex justify-between w-full text-xs text-gray-700 mt-1"
            >
              <span>DDV {entry.rate}%:</span>
              <span className="font-mono">
                {formatCurrency(entry.tax)} (osn. {formatCurrency(entry.base)})
              </span>
            </div>
          ))}

          <div className="flex justify-between w-full mt-2 pt-2 border-t border-dashed">
            <span>Skupaj DDV:</span>
            <span className="font-mono">{formatCurrency(totalTax)}</span>
          </div>

          <div className="flex justify-between w-full mt-2 pt-2 border-t-2 font-bold text-lg">
            <span>SKUPAJ:</span>
            <span className="font-mono">
              {formatCurrency(
                (order?.total_amount ?? subtotal + totalTax) -
                  (order?.tip_amount ?? 0),
              )}
            </span>
          </div>

          {/* Tip line (if tip > 0) */}
          {(order?.tip_amount ?? 0) > 0 && (
            <>
              <div className="flex justify-between w-full mt-1 text-sm">
                <span>Napitnina{order?.tip_type === "percentage" && ` (${order.tip_percentage}%)`}:</span>
                <span className="font-mono">
                  {formatCurrency(order?.tip_amount ?? 0)}
                </span>
              </div>
              <div className="flex justify-between w-full mt-1 pt-1 border-t font-bold text-lg">
                <span>SKUPAJ Z NAPITNINO:</span>
                <span className="font-mono">
                  {formatCurrency(order?.total_amount ?? 0)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Fiscal section — ZOI, EOR, QR */}
        {fiscalInvoice && (
          <>
            <hr className="my-3 border-dashed" />
            <div className="text-xs space-y-2">
              {fiscalInvoice.qrCode && (
                <div className="flex justify-center my-2">
                  <img
                    src={fiscalInvoice.qrCode}
                    alt="FURS QR"
                    className="w-32 h-32"
                  />
                </div>
              )}
              <div>
                <span className="font-medium">ZOI:</span>
                <p className="font-mono break-all text-[10px]">
                  {fiscalInvoice.zoi}
                </p>
              </div>
              {fiscalInvoice.eor && (
                <div>
                  <span className="font-medium">EOR:</span>
                  <p className="font-mono break-all text-[10px]">
                    {fiscalInvoice.eor}
                  </p>
                </div>
              )}
              {fiscalInvoice.status === "pending" && (
                <p className="text-amber-700 italic">
                  * Račun poslan v FURS (v obdelavi)
                </p>
              )}
              {fiscalInvoice.status === "failed" && (
                <p className="text-red-700 italic">
                  * Napaka pri pošiljanju v FURS — ponovni poskus bo
                  izveden avtomatsko
                </p>
              )}
              {fiscalConfig?.operatorTaxNumber && (
                <p className="text-center text-[10px] mt-2">
                  Operater: {fiscalConfig.operatorTaxNumber}
                </p>
              )}
              <p className="text-center text-[10px] mt-2">
                Hvala za obisk in lep pozdrav!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PrintOrderDetails;
