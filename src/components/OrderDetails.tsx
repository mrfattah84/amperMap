import React from "react";
import { useGetOrderDetailsQuery } from "../orderSlice";
import {
  Card,
  Spin,
  Alert,
  Tag,
  Button,
  List,
  Typography,
  Space,
  Divider,
  Descriptions,
} from "antd";
import {
  TruckOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CarryOutOutlined,
  DeliveredProcedureOutlined,
  ToolOutlined,
  CloseOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  BoxPlotOutlined,
} from "@ant-design/icons";
import { Padding } from "maplibre-gl";

type OrderDetailsProps = {
  orderId: number;
  onClose: () => void;
};

const getPriorityColor = (priority: string) => {
  if (priority === "High") return "red";
  if (priority === "Medium") return "orange";
  return "blue";
};

const getOrderIcon = (orderType: string) => {
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

const OrderDetails = ({ orderId, onClose }: OrderDetailsProps) => {
  const { data: order, isLoading, isError } = useGetOrderDetailsQuery(orderId);

  if (isLoading) return <Spin size="large" />;
  if (isError || !order)
    return <Alert message="Error loading order details" type="error" />;

  return (
    <Card
      title={
        <div className="flex justify-between items-center">
          <span>{order.barcode}</span>
          <Tag color={getPriorityColor(order.priority)}>{order.priority}</Tag>
        </div>
      }
      extra={
        <Button shape="circle" icon={<CloseOutlined />} onClick={onClose} />
      }
      style={{ width: 350 }}
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item
          label={
            <>
              <EnvironmentOutlined className="mr-2" />
              Address
            </>
          }
        >
          <div className="flex flex-col gap-0.5">
            <div className=" font-bold">{order.location?.locationName}</div>
            <div>postcode: {order.location?.zipCode}</div>
            <div>
              {order.location?.city}, {order.location?.addressLine1}
            </div>
          </div>
        </Descriptions.Item>
        <Descriptions.Item
          label={
            <>
              <UserOutlined className="mr-2" />
              Contact
            </>
          }
        >
          <div className="flex flex-col gap-0.5">
            <div className=" font-bold">{order.contact?.name}</div>
            <div>
              <PhoneOutlined /> {order.contact?.phone}
            </div>
            <div>
              <MailOutlined /> {order.contact?.email}
            </div>
          </div>
        </Descriptions.Item>
        <Descriptions.Item
          label={
            <>
              <TruckOutlined className="mr-2" />
              Driver
            </>
          }
        >
          {order.driver?.name}
        </Descriptions.Item>
        <Descriptions.Item
          label={
            <>
              <ClockCircleOutlined className="mr-2" />
              Time Windows
            </>
          }
        >
          <List
            size="small"
            itemLayout="vertical"
            dataSource={order.timeWindows}
            renderItem={(window) => (
              <List.Item style={{ padding: 0 }}>
                <div>{new Date(window.from).toLocaleTimeString()}</div>
                <div>{new Date(window.to).toLocaleTimeString()}</div>
              </List.Item>
            )}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Loads">
          <List
            size="small"
            itemLayout="vertical"
            dataSource={order.loads}
            renderItem={(load) => (
              <List.Item style={{ padding: 0 }}>
                <div>Load #{load.loadNumber}</div>
                <div>Weight: {load.weight}kg</div>
                <div>Volume: {load.volume}m³</div>
              </List.Item>
            )}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Notes">
          {order.notes || "No notes for this order."}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default OrderDetails;
