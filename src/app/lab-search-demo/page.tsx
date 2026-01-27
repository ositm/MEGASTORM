
'use client';

import { useState } from 'react';
import { useLabSearch } from '@/hooks/use-labs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LabSearchDemoPage() {
    const { labs, loading, error, nextPageToken, searchLabs, loadMore } = useLabSearch();
    const [city, setCity] = useState('Lagos');
    const [state, setState] = useState('Lagos');
    const [keyword, setKeyword] = useState('');
    const [openNow, setOpenNow] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchLabs({ city, state, keyword, open_now: openNow });
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">Lab Search Demo</h1>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Search Parameters</CardTitle>
                    <CardDescription>Enter location and details to find labs.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">City</label>
                            <Input
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g. Lagos"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">State</label>
                            <Input
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                placeholder="e.g. Lagos"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Keyword (Optional)</label>
                            <Input
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="e.g. DNA test"
                            />
                        </div>

                        <div className="flex items-center space-x-2 pt-8">
                            <input
                                type="checkbox"
                                id="openNow"
                                checked={openNow}
                                onChange={(e) => setOpenNow(e.target.checked)}
                                className="h-4 w-4"
                            />
                            <label htmlFor="openNow" className="text-sm font-medium">Open Now Only</label>
                        </div>

                        <div className="col-span-1 md:col-span-2 pt-2">
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? 'Searching...' : 'Search Labs'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Results ({labs.length})</h2>
                {labs.length === 0 && !loading && <p className="text-gray-500">No labs found.</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {labs.map((lab) => (
                        <Card key={lab.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg leading-tight">{lab.name}</CardTitle>
                                    {lab.rating > 0 && <Badge variant="secondary">★ {lab.rating}</Badge>}
                                </div>
                                <CardDescription className="text-xs line-clamp-1">{lab.formatted_address}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm pb-2">
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {lab.open_now && <Badge className="bg-green-600">Open Now</Badge>}
                                    {lab.business_status === 'OPERATIONAL' && <Badge variant="outline">Operational</Badge>}
                                </div>
                                <div className="text-gray-600 space-y-1">
                                    {lab.phone_number && <p>📞 {lab.phone_number}</p>}
                                    {lab.website && <p>🌐 <a href={lab.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Visit Website</a></p>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {nextPageToken && (
                    <Button onClick={loadMore} variant="outline" className="w-full mt-4" disabled={loading}>
                        {loading ? 'Loading...' : 'Load More Results'}
                    </Button>
                )}
            </div>
        </div>
    );
}
