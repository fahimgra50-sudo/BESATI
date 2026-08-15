import Header from "@/components/Header";
import CustomerTools from "@/components/CustomerTools";
export default function Page(){return <div className="min-h-screen bg-[#f2f0e9]"><Header showSearch={false}/><main className="max-w-lg mx-auto p-5"><CustomerTools type="address"/></main></div>}