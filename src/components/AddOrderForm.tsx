import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  message,
  DatePicker,
  InputNumber,
  Space,
} from "antd";
import {
  useAddContactMutation,
  useAddLocationMutation,
  useAddOrderMutation,
  useGetDriversQuery,
} from "../orderSlice";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import LocationPicker from "./LocationPicker";

const { Option } = Select;

type AddOrderFormProps = {
  visible: boolean;
  onClose: () => void;
};

const AddOrderForm = ({ visible, onClose }: AddOrderFormProps) => {
  const [form] = Form.useForm();
  const { data: drivers = [], isLoading: isLoadingDrivers } =
    useGetDriversQuery();
  const [addOrder, { isLoading }] = useAddOrderMutation();
  const [addContact] = useAddContactMutation();
  const [addLocation] = useAddLocationMutation();

  const handleFinish = async (values: any) => {
    try {
      // 1. Create the new contact
      const newContact = await addContact({
        name: values.contactName,
        phone: values.contactPhone,
      }).unwrap();

      // 2. Create the new location
      const newLocation = await addLocation({
        locationName: values.locationName,
        latitude: values.coords.latitude,
        longitude: values.coords.longitude,
      }).unwrap();

      // 3. Create the order with the new IDs
      const newOrderPayload = {
        contactId: newContact.id,
        locationId: newLocation.id,
        driverId: values.driverId,
        barcode: values.barcode,
        date: values.date ? values.date.format("YYYY-MM-DD") : undefined,
        duration: values.duration,
        orderType: values.orderType,
        priority: values.priority,
        notes: values.notes,
        loads: values.loads || [],
        timeWindows:
          values.timeWindows?.map((tw) => ({
            from: tw.range[0].toISOString(),
            to: tw.range[1].toISOString(),
          })) || [],
        active: true, // New orders are active by default
      };

      await addOrder(newOrderPayload).unwrap();
      message.success("Order added successfully!");
      form.resetFields();
      onClose();
    } catch (error) {
      message.error("Failed to add order. Please try again.");
      console.error("Failed to add order:", error);
    }
  };

  return (
    <Modal
      title="Add New Order"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isLoading}
          onClick={() => form.submit()}
        >
          Add Order
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="contactName"
          label="Contact Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="contactPhone" label="Contact Phone">
          <Input />
        </Form.Item>
        <Form.Item
          name="locationName"
          label="Location Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="barcode" label="Barcode">
          <Input />
        </Form.Item>
        <Form.Item name="date" label="Date">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="duration" label="Duration (minutes)">
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>
        <Form.Item name="coords" label="Location" rules={[{ required: true }]}>
          <LocationPicker />
        </Form.Item>
        <Form.Item name="driverId" label="Driver" rules={[{ required: true }]}>
          <Select loading={isLoadingDrivers} placeholder="Select a driver">
            {drivers.map((driver) => (
              <Option key={driver.id} value={driver.id}>
                {driver.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="orderType" label="Order Type" initialValue="Delivery">
          <Select>
            <Option value="Delivery">Delivery</Option>
            <Option value="Pickup">Pickup</Option>
            <Option value="Service">Service</Option>
          </Select>
        </Form.Item>
        <Form.Item name="priority" label="Priority" initialValue="Medium">
          <Select>
            <Option value="High">High</Option>
            <Option value="Medium">Medium</Option>
            <Option value="Low">Low</Option>
          </Select>
        </Form.Item>
        <Form.List name="loads">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...restField}
                    name={[name, "weight"]}
                    label="Weight (kg)"
                    rules={[{ required: true, message: "Missing weight" }]}
                  >
                    <InputNumber placeholder="Weight" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "volume"]}
                    label="Volume (m³)"
                    rules={[{ required: true, message: "Missing volume" }]}
                  >
                    <InputNumber placeholder="Volume" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Load
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
        <Form.List name="timeWindows">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: "flex" }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, "range"]}
                    label="Time Window"
                    rules={[{ required: true }]}
                  >
                    <DatePicker.RangePicker showTime />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Time Window
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddOrderForm;
