import React from "react";
import { List, Checkbox } from "antd";
import { useChangeActiveMutation, selectUserById } from "../userSlice";
import { useSelector } from "react-redux";

const UserListItem = React.memo(({ userId }: { userId: number | string }) => {
  const user = useSelector((state) => selectUserById(state, userId));
  const [changeActive] = useChangeActiveMutation();

  // It's possible the user is not found if data is still loading or has been removed
  if (!user) return null;
  return (
    <List.Item key={user.id}>
      <List.Item.Meta title={user.name} />
      <Checkbox
        onChange={() => changeActive(user)}
        checked={user.active}
      ></Checkbox>
    </List.Item>
  );
});

export default UserListItem;
