import { createSelector, createEntityAdapter } from "@reduxjs/toolkit";
import { apiSlice } from "./api/apiSlice";

const userAdapter = createEntityAdapter();

const initialState = userAdapter.getInitialState();

export const extendedApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => "/users",
      transformResponse: (responseData: any) => {
        return userAdapter.setAll(initialState, responseData);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.ids.map((id) => ({ type: "users" as const, id })),
              { type: "users", id: "LIST" },
            ]
          : [{ type: "users", id: "LIST" }],
    }),
  }),
});

export const { useGetUsersQuery } = extendedApiSlice;

export const selectUsersResult = extendedApiSlice.endpoints.getUsers.select();

const selectUsersData = createSelector(
  selectUsersResult,
  (usersResult) => usersResult.data
);

export const { selectAll: selectAllUsers, selectById: selectUserById } =
  userAdapter.getSelectors(
    (state: any) => selectUsersData(state) ?? initialState
  );
