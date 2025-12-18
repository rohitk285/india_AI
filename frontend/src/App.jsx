import { Routes, Route, BrowserRouter } from "react-router-dom";
import UploadPage from './Pages/UploadPage';
import EntryPage from "./Pages/EntryPage";
import UserDetailsPage from "./Pages/UserDetailsPage";
import RetrievalPageDate from "./Pages/RetrievalPageDate";
import ConfirmDetailsPage from "./Pages/ConfirmDetailsPage";
import UpdateDetails from "./Pages/UpdateDetails";
import UserDetailsUpdate from "./Pages/UserDetailsUpdate";
import SecondaryConfirmPage from "./Pages/SecondaryConfirmPage";
import LoginPage from "./Pages/Auth/LoginPage";
import SignupPage from "./Pages/Auth/SignUpPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import RetrievalPageCustID from "./Pages/RetrievalPageCustID";
import UploadFingerprintPage from "./Pages/UploadFingerPrint";


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/sign-up" element={<PublicRoute><SignupPage /></PublicRoute>} />

          <Route path="/retrieve-customer" element={<ProtectedRoute><EntryPage /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/user-details" element={<ProtectedRoute><UserDetailsPage /></ProtectedRoute>} />
          <Route path="/retrieve-custid" element={<ProtectedRoute><RetrievalPageCustID/></ProtectedRoute>} />
          <Route path="/retrievedate" element={<ProtectedRoute><RetrievalPageDate /></ProtectedRoute>} />
          <Route path="/confirm-details" element={<ProtectedRoute><ConfirmDetailsPage /></ProtectedRoute>} />
          <Route path="/updateDetails" element={<ProtectedRoute><UpdateDetails /></ProtectedRoute>} />
          <Route path="/user-details-update" element={<ProtectedRoute><UserDetailsUpdate /></ProtectedRoute>} />
          <Route path="/secondaryConfirm" element={<ProtectedRoute><SecondaryConfirmPage /></ProtectedRoute>} />
          <Route path="/uploadFingerprint" element={<ProtectedRoute><UploadFingerprintPage/></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
