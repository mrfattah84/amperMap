import MapComponent from "./components/MapComponent";
import { List, Input, Checkbox } from "antd";
import { useEffect, useState } from "react";

import type { GetProps } from "antd";

interface User {
  id: number;
  name: string;
  active: boolean;
  // Add other user properties here if they exist
}
function App() {
  const [data, setData] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/users")
      .then((userData) => userData.json())
      .then((userData) => setData(userData));
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleCheckboxChange = (userId: number) => {
    setData((prevData) =>
      prevData.map((user) =>
        user.id === userId ? { ...user, active: !user.active } : user
      )
    );
  };

  return (
    <div className="flex gap-2 w-dvw h-dvh">
      <div className="w-1/4 flex flex-col">
        <Input.Search
          className="mb-2"
          placeholder="input search text"
          onSearch={handleSearch}
          enterButton
          allowClear
        />
        <List
          className="grow overflow-auto bg-white"
          bordered
          dataSource={data.filter((user: { name: string }) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase())
          )}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta title={item.name} />
              <Checkbox
                onChange={() => handleCheckboxChange(item.id)}
                checked={item.active}
              ></Checkbox>
            </List.Item>
          )}
        />
      </div>
      <div className="flex-grow rounded-lg overflow-hidden">
        <MapComponent data={data} />
      </div>
    </div>
  );
}

export default App;
