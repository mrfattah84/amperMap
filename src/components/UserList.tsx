import React from "react";
import { List } from "antd";
import { useSelector } from "react-redux";
import { selectUserIdsBySearch } from "../userSlice";
import UserListItem from "./UserListItem";

const UserList = ({ searchTerm }: { searchTerm: string }) => {
  // Memoize the selector itself, so it's not recreated on every render.
  // A new selector will only be created when `searchTerm` changes.
  const selectUserIds = React.useMemo(
    () => selectUserIdsBySearch(searchTerm),
    [searchTerm]
  );
  // This component now only subscribes to the list of user IDs.
  // It will NOT re-render when a user's `active` property changes.
  const userIds = useSelector((state) => selectUserIds(state, searchTerm));

  return (
    <List
      className="grow overflow-auto bg-white"
      bordered
      dataSource={userIds}
      renderItem={(userId) => <UserListItem key={userId} userId={userId} />}
    />
  );
};

export default UserList;
