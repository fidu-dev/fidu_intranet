import { AgencyProduct } from '@/lib/airtable/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface ProductCardProps {
    product: AgencyProduct;
}

export function ProductCard({ product }: ProductCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card className="overflow-hidden border-0 shadow-lg transition-all hover:shadow-xl rounded-xl group bg-white">
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    {product.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt={product.tourName}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                            No Image
                        </div>
                    )}
                    <div className="absolute top-4 left-4">
                        <Badge variant="secondary" className="backdrop-blur-md bg-white/80 text-gray-900 font-medium">
                            {product.category}
                        </Badge>
                    </div>
                </div>

                <CardHeader className="p-5 pb-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
                        {product.destination}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                        {product.tourName}
                    </h3>
                </CardHeader>

                <CardContent className="p-5 pt-2">
                    <p className="text-sm text-gray-500 line-clamp-2">
                        Experience the best of {product.destination} with this exclusive tour package.
                    </p>
                </CardContent>

                <CardFooter className="p-5 pt-0 flex items-end justify-between">
                    <div className="space-y-1">
                        <div>
                            <span className="text-xs text-blue-600 font-medium block">Neto (Seu Custo)</span>
                            <div className="text-sm font-semibold text-gray-700">
                                R$ {product.netoPriceAdulto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 font-medium block">Sugestão Venda</span>
                            <div className="text-2xl font-bold text-gray-900">
                                R$ {product.salePriceAdulto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                    <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors">
                        View Details
                    </button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
