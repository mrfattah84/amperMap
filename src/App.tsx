import MapComponent from "./components/MapComponent";
import { Input } from "antd";
import { useState } from "react";
import DeliveryList from "./components/DeliveryList";
import OrderDetails from "./components/OrderDetails";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const handleShowDetails = (orderId: number) => setSelectedOrderId(orderId);
  const handleCloseDetails = () => setSelectedOrderId(null);

  return (
    <div className="flex gap-2 w-screen h-screen relative p-1">
      <div className="flex flex-col">
        <Input.Search
          className="mb-2"
          placeholder="input search text"
          enterButton
          allowClear
          onSearch={(value) => setSearchTerm(value)}
        />
        <DeliveryList
          searchTerm={searchTerm}
          onShowDetails={handleShowDetails}
        />
      </div>
      <div className="flex-grow rounded-lg overflow-hidden">
        <MapComponent />
      </div>
      <div className="absolute top-0 right-0 m-4">
        {selectedOrderId && (
          <OrderDetails
            orderId={selectedOrderId}
            onClose={handleCloseDetails}
          />
        )}
      </div>
    </div>
  );
}

export default App;
