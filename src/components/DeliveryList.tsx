import React from "react";
import { useSelector } from "react-redux";
import { selectOrderIdsBySearch } from "../orderSlice";
import { List } from "antd";
import DeliveryCard from "./DeliveryCard";

const DeliveryList = ({ searchTerm }) => {
  const selectorderIds = React.useMemo(
    () => selectOrderIdsBySearch(searchTerm),
    [searchTerm]
  );
  // This component now only subscribes to the list of order IDs.
  // It will NOT re-render when a order's `active` property changes.
  const orderIds = useSelector((state) => selectorderIds(state, searchTerm));

  return (
    <List
      className="grow overflow-auto bg-white flex gap-4 p-4"
      bordered
      dataSource={orderIds}
      renderItem={(orderId) => <DeliveryCard key={orderId} orderId={orderId} />}
    />
  );
};

export default DeliveryList;
