import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Café Ops | Operations Hub",description:"Cafe SOP, costing, staff and daily operations"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
