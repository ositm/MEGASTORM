import FindALab from "@/components/find-a-lab";

export default function SchedulePage() {
    return (
        <div className="min-h-screen bg-gray-100 lg:py-8 px-4 lg:px-8 lg:max-w-7xl">
            <header className="flex items-center space-x-4 mb-6 p-4 border-b">
                <h1 className="text-2xl font-semibold text-gray-800">Find a Lab - Search Results</h1>
            </header>
            <main>
                <div className="flex flex-col gap-4 mb-6">
                    <p className="text-gray-600">To make an appointment or get detailed lab information use the search below. Walk-ins are also welcome. When visiting a lab, you should bring the LabCorp test request form from a health care professional requesting the laboratory testing.</p>
                    <p className="text-gray-600">Not all locations offer all services.</p>
                </div>
                <FindALab />
            </main>
        </div>
    );
}
