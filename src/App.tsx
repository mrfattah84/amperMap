import MapComponent from "./components/MapComponent";
import { Input } from "antd";
import { useState } from "react";
import UserList from "./components/UserList";
import DeliveryList from "./components/DeliveryList";

function App() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex gap-2 w-dvw h-dvh">
      <div className="flex flex-col">
        <Input.Search
          className="mb-2"
          placeholder="input search text"
          enterButton
          allowClear
          onSearch={(value) => setSearchTerm(value)}
        />
        <DeliveryList searchTerm={searchTerm} />
      </div>
      <div className="flex-grow rounded-lg overflow-hidden">
        <MapComponent />
      </div>
    </div>
  );
}

export default App;
