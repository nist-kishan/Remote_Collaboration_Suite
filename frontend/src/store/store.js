import { configureStore } from "@reduxjs/toolkit";
import authreducer from "./slice/authSlice";
import chatReducer from "./slice/chatSlice";
import documentReducer from "./slice/documentSlice";
import callReducer from "./slice/callSlice";
import meetingReducer from "./slice/meetingSlice";
// import projectReducer from "./slice/projectSlice";
// import notificationReducer from "./slice/notificationSlice";
import whiteboardReducer from "./slice/whiteboardSlice";
import taskReducer from "./slice/taskSlice";
// import workspaceReducer from "./slice/workspaceSlice";

const store = configureStore({
  reducer: {
    auth: authreducer,
    chat: chatReducer,
    documents: documentReducer,
    call: callReducer,
    meeting: meetingReducer,
    // project: projectReducer,
    // notification: notificationReducer,
    whiteboard: whiteboardReducer,
    task: taskReducer,
    // workspace: workspaceReducer,
  },
});

export default store;
