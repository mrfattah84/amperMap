import React from "react";
import {
  Order,
  useChangeActiveMutation,
  useGetOrderDetailsQuery,
} from "../orderSlice";
import { Card, Switch, Tag, Spin, Alert } from "antd";
import {
  TruckOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CarryOutOutlined,
  DeliveredProcedureOutlined,
  ToolOutlined,
} from "@ant-design/icons";

type DeliveryCardProps = {
  orderId: number;
};

const DeliveryCard = React.memo(({ orderId }: DeliveryCardProps) => {
  const { data: order, isLoading, isError } = useGetOrderDetailsQuery(orderId);
  const [changeActive] = useChangeActiveMutation();

  if (isLoading) {
    return <Spin />;
  }

  if (isError || !order) {
    return <Alert message="Error loading order details" type="error" />;
  }

  const getPriorityColor = (priority) => {
    if (priority === "High") return "red";
    if (priority === "Medium") return "orange";
    return "blue";
  };

  const getOrderIcon = (orderType) => {
    switch (orderType) {
      case "Delivery":
        return <DeliveredProcedureOutlined className="mr-2" />;
      case "Pickup":
        return <CarryOutOutlined className="mr-2" />;
      case "Service":
        return <ToolOutlined className="mr-2" />;
      default:
        return <TruckOutlined className="mr-2" />;
    }
  };

  return (
    <Card
      className="w-full"
      key={order.id}
      title={
        <div className="flex justify-between items-center">
          <span>
            {getOrderIcon(order.orderType)}
            {order.orderType} #{order.id}
          </span>
          <Tag color={getPriorityColor(order.priority)}>{order.priority}</Tag>
        </div>
      }
      extra={
        <Switch onChange={() => changeActive(order)} checked={order.active} />
      }
    >
      <div className="mb-2">
        <p className="font-semibold">Notes:</p>
        <p>{order.notes}</p>
      </div>
      <div className="space-y-2 text-sm">
        <p>
          <EnvironmentOutlined className="mr-2" />
          <strong>Location:</strong> {order.location?.locationName}
        </p>
        <p>
          <UserOutlined className="mr-2" />
          <strong>Contact:</strong> {order.contact?.name}
        </p>
        <p>
          <TruckOutlined className="mr-2" />
          <strong>Driver:</strong> {order.driver?.name}
        </p>
      </div>
    </Card>
  );
});

export default DeliveryCard;
