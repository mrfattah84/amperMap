import MapComponent from "./components/MapComponent";
import { FloatButton, Input } from "antd";
import { useEffect, useState } from "react";
import DeliveryList from "./components/DeliveryList";
import AddOrderForm from "./components/AddOrderForm";
import OrderDetails from "./components/OrderDetails";
import { PlusCircleOutlined } from "@ant-design/icons";
import { useAppDispatch } from "./hooks";
import { useGetExpandedOrdersQuery, useGetOrdersQuery } from "./orderSlice";
import { fitBounds } from "./mapSlice";
import maplibregl from "maplibre-gl";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isAddOrderModalVisible, setIsAddOrderModalVisible] = useState(false);
  const dispatch = useAppDispatch();
  const { data: orders = [] } = useGetExpandedOrdersQuery();
  useGetOrdersQuery(); // This hook populates the cache for the DeliveryList selector

  const handleShowDetails = (orderId: number) => setSelectedOrderId(orderId);
  const handleCloseDetails = () => setSelectedOrderId(null);

  const showAddOrderModal = () => setIsAddOrderModalVisible(true);
  const hideAddOrderModal = () => setIsAddOrderModalVisible(false);

  useEffect(() => {
    if (selectedOrderId !== null) {
      const order = orders.find((o) => o.id === selectedOrderId);
      if (order?.location?.longitude && order.location?.latitude) {
        const { longitude, latitude } = order.location;
        const offset = 0.01;
        const bounds: [[number, number], [number, number]] = [
          [longitude - offset, latitude - offset],
          [longitude + offset, latitude + offset],
        ];
        dispatch(fitBounds(bounds, { maxZoom: 15, padding: 200 }));
      }
    } else {
      // When no order is selected, fit to all active orders
      const activeOrderCoords = orders
        .filter(
          (order) =>
            order.active &&
            order.location?.latitude &&
            order.location?.longitude
        )
        .map((order) => [order.location.longitude, order.location.latitude]);

      if (activeOrderCoords.length > 0) {
        const bounds = activeOrderCoords.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new maplibregl.LngLatBounds(activeOrderCoords[0], activeOrderCoords[0]));
        dispatch(fitBounds(bounds));
      }
    }
  }, [selectedOrderId, orders, dispatch]);

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
        <MapComponent onMarkerClick={handleShowDetails} />
      </div>
      <div className="absolute top-0 right-0 m-4">
        {selectedOrderId && (
          <OrderDetails
            orderId={selectedOrderId}
            onClose={handleCloseDetails}
          />
        )}
      </div>
      <AddOrderForm
        visible={isAddOrderModalVisible}
        onClose={hideAddOrderModal}
      />
      <FloatButton icon={<PlusCircleOutlined />} onClick={showAddOrderModal} />
    </div>
  );
}

export default App;
