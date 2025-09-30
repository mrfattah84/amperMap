import React from "react";
import { useSelector } from "react-redux";
import { selectOrderIdsBySearch } from "../orderSlice";
import { FloatButton, List } from "antd";
import DeliveryCard from "./DeliveryCard";

const DeliveryList = ({ searchTerm, onShowDetails }) => {
  const selectorderIds = React.useMemo(
    () => selectOrderIdsBySearch(searchTerm),
    [searchTerm]
  );
  // This component now only subscribes to the list of order IDs.
  // It will NOT re-render when a order's `active` property changes.
  const orderIds = useSelector((state) => selectorderIds(state, searchTerm));

  return (
    <div className="relative overflow-auto w-full h-full">
      <List
        dataSource={orderIds}
        renderItem={(orderId) => (
          <DeliveryCard
            key={orderId}
            orderId={orderId}
            onShowDetails={onShowDetails}
          />
        )}
      />
    </div>
  );
};

export default DeliveryList;
