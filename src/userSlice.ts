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
    changeActive: builder.mutation({
      query: (user) => ({
        url: `/users/${user.id}`,
        method: "PATCH",
        body: { active: !user.active },
      }),
      async onQueryStarted(user, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          extendedApiSlice.util.updateQueryData(
            "getUsers",
            undefined,
            (draft) => {
              const userToUpdate = draft.entities[user.id];
              if (userToUpdate) {
                userToUpdate.active = !user.active;
              }
            }
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, arg) => [{ type: "users", id: arg.id }],
    }),
  }),
});

export const { useGetUsersQuery, useChangeActiveMutation } = extendedApiSlice;

export const selectUsersResult = extendedApiSlice.endpoints.getUsers.select();

const selectUsersData = createSelector(
  selectUsersResult,
  (usersResult) => usersResult.data
);

export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectIds: selectUserIds,
  selectEntities: selectUserEntities,
} = userAdapter.getSelectors(
  (state: any) => selectUsersData(state) ?? initialState
);

export const selectUserBySearch = (search: string) =>
  createSelector(selectAllUsers, (users) =>
    users.filter((user) =>
      user.name.toLowerCase().includes(search.toLowerCase())
    )
  );

export const selectUserIdsBySearch = (search: string) =>
  createSelector(
    // Stable Dependencies:
    selectUserIds, // The array of all user IDs
    selectUserEntities, // The dictionary of user entities
    (_state, search: string) => search, // The search term
    // Result function
    (userIds, userEntities, search) => {
      const lowerCaseSearch = search.toLowerCase();
      if (!search) return userIds as (number | string)[];
      return (userIds as (number | string)[]).filter((id) =>
        userEntities[id]?.name.toLowerCase().includes(lowerCaseSearch)
      );
    }
  );
