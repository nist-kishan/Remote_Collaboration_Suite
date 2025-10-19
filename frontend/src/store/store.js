import { configureStore } from "@reduxjs/toolkit";
import authreducer from "./slice/authSlice";
import chatReducer from "./slice/chatSlice";
import documentReducer from "./slice/documentSlice";

const store = configureStore({
  reducer: {
    auth: authreducer,
    chat: chatReducer,
    documents: documentReducer,
  },
});

export default store;
