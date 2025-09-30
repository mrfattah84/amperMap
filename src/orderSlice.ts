// src/features/orders/orderSlice.ts

import {
  createSelector,
  createEntityAdapter,
  EntityState,
} from "@reduxjs/toolkit";
import { apiSlice } from "./api/apiSlice";

// ## 1. Type Definitions ##
// These types should match the structure of your db.json file.

type Load = {
  loadNumber: number;
  weight: number;
  volume: number;
};

type TimeWindow = {
  from: string;
  to: string;
};

export type Contact = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

export type Location = {
  id: number;
  locationName: string;
  addressLine1: string;
  city: string;
  latitude: number;
  longitude: number;
};

export type Driver = {
  id: number;
  name: string;
  skills: string[];
  vehicleFeatures: string[];
};

export type Order = {
  id: number;
  orderType: "Delivery" | "Pickup" | "Service";
  date?: string;
  duration?: number;
  priority: "High" | "Medium" | "Low";
  notes?: string;
  barcode?: string;
  locationId: number;
  contactId: number;
  driverId: number;
  loads?: Load[];
  timeWindows?: TimeWindow[];
  active: boolean;
};

// Represents the combined data from the _expand query
export type ExpandedOrder = Order & {
  contact: Contact;
  location: Location;
  driver: Driver;
};

// ## 2. Entity Adapter ##

const orderAdapter = createEntityAdapter<Order>({
  selectId: (order) => order.id,
  sortComparer: (a, b) => b.id - a.id, // Show newest first by ID
});

const initialState = orderAdapter.getInitialState();

// ## 3. API Slice Endpoint Injection ##

export const extendedApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Query to get all orders and normalize them
    getOrders: builder.query<EntityState<Order>, void>({
      query: () => "/orders",
      transformResponse: (responseData: Order[]) => {
        return orderAdapter.setAll(initialState, responseData);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.ids.map((id) => ({ type: "Order" as const, id })),
              { type: "Order", id: "LIST" },
            ]
          : [{ type: "Order", id: "LIST" }],
    }),

    // Query to get all orders with their related data expanded
    getExpandedOrders: builder.query<ExpandedOrder[], void>({
      query: () => "/orders?_expand=contact&_expand=location&_expand=driver",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Order" as const, id })),
              { type: "Order", id: "LIST" },
            ]
          : [{ type: "Order", id: "LIST" }],
    }),

    // Query to get all drivers
    getDrivers: builder.query<Driver[], void>({
      query: () => "/drivers",
    }),

    // Query to get a single order with its related driver, contact, and location
    getOrderDetails: builder.query<ExpandedOrder, number>({
      query: (orderId) =>
        `/orders/${orderId}?_expand=contact&_expand=location&_expand=driver`,
      providesTags: (result, error, arg) => [{ type: "Order", id: arg }],
    }),

    // Mutation to add a new contact
    addContact: builder.mutation<Contact, Partial<Contact>>({
      query: (newContact) => ({
        url: "/contacts",
        method: "POST",
        body: newContact,
      }),
    }),

    // Mutation to add a new location
    addLocation: builder.mutation<Location, Partial<Location>>({
      query: (newLocation) => ({
        url: "/locations",
        method: "POST",
        body: newLocation,
      }),
    }),

    // Mutation to add a new order
    addOrder: builder.mutation<Order, Partial<Order>>({
      query: (newOrder) => ({
        url: "/orders",
        method: "POST",
        body: newOrder,
      }),
      async onQueryStarted(newOrder, { dispatch, queryFulfilled }) {
        // Invalidate the 'LIST' tag for getExpandedOrders to ensure it refetches.
        // This is simpler and safer than manually updating it, as other parts of the app might use it.
        const expandedOrdersPromise = dispatch(
          extendedApiSlice.util.invalidateTags([{ type: "Order", id: "LIST" }])
        );

        try {
          const { data: addedOrder } = await queryFulfilled;
          // Manually update the normalized 'getOrders' cache
          dispatch(
            extendedApiSlice.util.updateQueryData(
              "getOrders",
              undefined,
              (draft) => {
                // The `getOrders` endpoint uses an entity adapter, so we use `addOne`
                if (addedOrder) {
                  orderAdapter.addOne(draft, addedOrder);
                }
              }
            )
          );
        } catch {}

        await expandedOrdersPromise;
      },
    }),

    // Mutation to update an existing order with optimistic updates
    updateOrder: builder.mutation<Order, Partial<Order> & Pick<Order, "id">>({
      query: ({ id, ...patch }) => ({
        url: `/orders/${id}`,
        method: "PATCH",
        body: patch,
      }),
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          extendedApiSlice.util.updateQueryData(
            "getOrders",
            undefined,
            (draft) => {
              orderAdapter.updateOne(draft, { id, changes: patch });
            }
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, arg) => [{ type: "Order", id: arg.id }],
    }),

    changeActive: builder.mutation<Order, Order>({
      query: (order) => ({
        url: `/orders/${order.id}`,
        method: "PATCH",
        body: { active: !order.active },
      }),
      async onQueryStarted(order, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          extendedApiSlice.util.updateQueryData(
            "getExpandedOrders",
            undefined,
            (draft) => {
              // Since getExpandedOrders returns an array, we find the order by id
              const orderToUpdate = draft.find((o) => o.id === order.id);
              if (orderToUpdate) {
                orderToUpdate.active = !orderToUpdate.active;
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
      invalidatesTags: (result, error, arg) => [{ type: "Order", id: arg.id }],
    }),

    // Mutation to delete an order with optimistic updates
    deleteOrder: builder.mutation<void, Order["id"]>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          extendedApiSlice.util.updateQueryData(
            "getOrders",
            undefined,
            (draft) => {
              orderAdapter.removeOne(draft, id);
            }
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, arg) => [{ type: "Order", id: arg }],
    }),
  }),
});

// ## 4. Export Hooks ##

export const {
  useGetOrdersQuery,
  useGetExpandedOrdersQuery,
  useGetDriversQuery,
  useGetOrderDetailsQuery,
  useAddOrderMutation,
  useUpdateOrderMutation,
  useAddContactMutation,
  useAddLocationMutation,
  useChangeActiveMutation, // <-- Export the new hook
  useDeleteOrderMutation,
} = extendedApiSlice;

// ## 5. Selectors ##

// Selector to get the raw query result object
export const selectOrdersResult = extendedApiSlice.endpoints.getOrders.select();

// Memoized selector to get the normalized order data
const selectOrdersData = createSelector(
  selectOrdersResult,
  (ordersResult) => ordersResult.data // normalized state object with ids & entities
);

// Export the standard entity adapter selectors
export const {
  selectAll: selectAllOrders,
  selectById: selectOrderById,
  selectIds: selectOrderIds,
} = orderAdapter.getSelectors(
  (state: any) => selectOrdersData(state) ?? initialState
);

// Selector for expanded orders
export const selectExpandedOrdersResult =
  extendedApiSlice.endpoints.getExpandedOrders.select();
const selectExpandedOrdersData = createSelector(
  selectExpandedOrdersResult,
  (ordersResult) => ordersResult.data
);
export const selectAllExpandedOrders = createSelector(
  selectExpandedOrdersData,
  (orders) => orders ?? []
);

// ## Custom Memoized Selectors ##

// Get orders assigned to a specific driver
export const selectOrdersByDriverId = (driverId: number) =>
  createSelector(selectAllOrders, (orders) =>
    orders.filter((order) => order.driverId === driverId)
  );

// Filter order IDs by a search term (e.g., notes or barcode)
export const selectOrderIdsBySearch = (search: string) =>
  createSelector(selectAllOrders, (orders) => {
    if (!search) {
      return orders.map((order) => order.id);
    }
    const lowerCaseSearch = search.toLowerCase();
    return orders
      .filter(
        (order) =>
          order.notes?.toLowerCase().includes(lowerCaseSearch) ||
          order.barcode?.toLowerCase().includes(lowerCaseSearch)
      )
      .map((order) => order.id);
  });

// Get all orders with a 'High' priority
export const selectHighPriorityOrderIds = createSelector(
  selectAllOrders,
  (orders) =>
    orders.filter((order) => order.priority === "High").map((order) => order.id)
);
