import { getAdminProducts } from '@/app/admin/actions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
    const products = await getAdminProducts();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Products Base Values</h1>
                <Badge variant="outline" className="text-gray-500">Read Only from Airtable</Badge>
            </div>

            <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead>Tour Name</TableHead>
                            <TableHead>Destination</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right font-bold text-gray-900">Base Price (Neto)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.tourName}</TableCell>
                                <TableCell>{product.destination}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        {product.category}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    R$ {product.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
