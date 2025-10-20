import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { setNavigateFunction } from "./utils/navigation";

import ApplicationLayout from "./components/ApplicationLayout";
import ToastNotification from "./components/ui/ToastNotification";
import ApplicationLoadingSpinner from "./components/ui/ApplicationLoadingSpinner";
import ChatNotificationToast from "./components/chat/ChatNotificationToast";
import BrowserExtensionNotification from "./components/ui/BrowserExtensionNotification";
import { setupGlobalErrorHandling } from "./utils/errorHandler";
import Login from "./pages/authenication/Login";
import Signup from "./pages/authenication/Signup";
import ResetPassword from "./pages/authenication/ResetPassword";
import ChangePassword from "./pages/authenication/ChangePassword";
import OtpVerification from "./pages/authenication/OtpVerification";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import PageNotFound from "./pages/PageNotFound";
import Dashboard from "./pages/Dashboard";
import RequestOtp from "./pages/authenication/RequestOtp";
// import VideoCall from "./pages/VideoCall";
// import DocumentPreviewModal from "./components/documents/DocumentPreviewModal";
// import DocumentsList from "./pages/documents/DocumentsList";
// import NewDocument from "./pages/documents/NewDocument";
// import EditDocument from "./pages/documents/EditDocument";
// import SharedDocument from "./pages/documents/SharedDocument";
// import SharedDocumentsList from "./pages/documents/SharedDocumentsList";
// import WhiteboardsList from "./pages/whiteboards/WhiteboardsList";
// import NewWhiteboard from "./pages/whiteboards/NewWhiteboard";
// import WhiteboardEditor from "./pages/whiteboards/WhiteboardEditor";
// import Whiteboard from "./pages/Whiteboard";
// import ChatPage from "./pages/ChatPage";
// import CallHistoryPage from "./pages/CallHistoryPage";
// import MediaViewerPage from "./pages/MediaViewerPage";
// import WorkspaceListGrid from "./components/workspace/WorkspaceListGrid";
// import WorkspacePage from "./pages/workspace/WorkspacePage";
// import ProjectPage from "./pages/project/ProjectPage";
// import AllProjectsPage from "./pages/AllProjectsPage";
import { useCurrentUser } from "./hook/useAuth";
import { useDispatch, useSelector } from "react-redux";
import { clearUser, setUser } from "./store/slice/authSlice";
import ResetPasswordWithLink from "./pages/authenication/ResetPasswordWithLink";

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  const isAuthPage =
    ["/login", "/signup", "/reset-password"].includes(location.pathname) ||
    location.pathname.startsWith("/reset-password/");

  const query = useCurrentUser();
  const { data, isSuccess, isError } = query;

  useEffect(() => {
    setupGlobalErrorHandling();
    // Set up global navigation function for non-React contexts
    setNavigateFunction(navigate);
  }, [navigate]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (loading && !isAuthPage) {
      const timeout = setTimeout(() => {
        console.warn("Loading timeout reached, clearing user and stopping loading");
        dispatch(clearUser());
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading, isAuthPage, dispatch]);

  useEffect(() => {
    if (isSuccess && data?.data?.user) {
      dispatch(setUser({ user: data.data.user }));
    } else if (isSuccess && data?.data) {
      dispatch(setUser({ user: data.data }));
    } else if (isSuccess && data?.user) {
      dispatch(setUser({ user: data.user }));
    } else if (isSuccess && data && !data.data && !data.user) {
      dispatch(setUser({ user: data }));
    } else if (isError && !isAuthPage) {
      if (
        query.error?.response?.status === 401 ||
        query.error?.response?.status === 403
      ) {
        dispatch(clearUser());
      }
      if (query.error?.response?.status === 429) {
        console.warn("Rate limit exceeded, retrying later...");
      }
    }
  }, [isSuccess, isError, data, dispatch, query.error?.response?.status, isAuthPage]);

  if (loading) return <ApplicationLoadingSpinner message="Initializing application..." />;

  return (
    <>
      <Routes>
        {/* ==================== AUTHENTICATION ROUTES ==================== */}
        <Route element={<ApplicationLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/reset-password/:token"
            element={<ResetPasswordWithLink />}
          />
        </Route>

        {/* ==================== PROTECTED ROUTES ==================== */}
          <Route element={<ProtectedRoute />}>
          <Route element={<ApplicationLayout />}>
            {/* ==================== DASHBOARD & PROFILE ==================== */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/changepassword" element={<ChangePassword />} />
            <Route path="/verification-otp" element={<OtpVerification />} />
            <Route path="/request-otp" element={<RequestOtp />} />

            {/* ==================== COMMUNICATION FEATURES ==================== */}
            {/* Chat & Messaging */}
            {/* <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:receiverId" element={<ChatPage />} />
            <Route path="/chats/group/:groupId" element={<ChatPage />} /> */}

            {/* Video Calling */}
            {/* <Route path="/video-call" element={<VideoCall />} />
            <Route path="/call/:callId" element={<VideoCall />} />
            <Route path="/call-history" element={<CallHistoryPage />} /> */}

            {/* Media Viewer */}
            {/* <Route path="/media/:chatId" element={<MediaViewerPage />} />
            <Route path="/media/:chatId/:messageId" element={<MediaViewerPage />} /> */}

            {/* ==================== DOCUMENT MANAGEMENT ==================== */}
            {/* <Route path="/documents" element={<DocumentsList />} />
            <Route path="/documents/new" element={<NewDocument />} />
            <Route path="/documents/edit/:documentId" element={<EditDocument />} />
            <Route path="/documents/shared" element={<SharedDocumentsList />} />
            <Route path="/documents/shared/:documentId" element={<SharedDocument />} />
            <Route path="/documents/preview/:documentId" element={<DocumentPreview />} /> */}

            {/* ==================== WHITEBOARD COLLABORATION ==================== */}
            {/* <Route path="/boards" element={<WhiteboardsList />} />
            <Route path="/boards/new" element={<NewWhiteboard />} />
            <Route path="/boards/:whiteboardId" element={<WhiteboardEditor />} />
            <Route path="/boards/shared/:whiteboardId" element={<WhiteboardEditor />} />
            <Route path="/whiteboard" element={<Whiteboard />} /> */}

            {/* ==================== WORKSPACE & PROJECT MANAGEMENT ==================== */}
            {/* Workspace Management */}
            {/* <Route path="/workspaces" element={<WorkspaceListGrid />} />
            <Route path="/workspace/:workspaceId" element={<WorkspacePage />} /> */}

            {/* Project Management */}
            {/* <Route path="/projects" element={<AllProjectsPage />} />
            <Route path="/workspace/:workspaceId/projects/:projectId" element={<ProjectPage />} />
            <Route path="/workspace/:workspaceId/projects/:projectId/board" element={<ProjectPage />} />
            <Route path="/workspace/:workspaceId/projects/:projectId/tasks/:taskId" element={<ProjectPage />} /> */}
            {/* Meeting Management */}
            {/* <Route path="/workspace/:workspaceId/projects/:projectId/meetings" element={<ProjectPage />} />
            <Route path="/workspace/:workspaceId/projects/:projectId/meetings/:meetingId" element={<ProjectPage />} /> */}
          </Route>
        </Route>

        {/* ==================== ERROR HANDLING ==================== */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>

      <div className="relative z-[9999] pointer-events-auto">
        <ToastNotification />
        <ChatNotificationToast />
        <BrowserExtensionNotification />
      </div>
    </>
  );
}
