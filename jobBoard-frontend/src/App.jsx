import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import JobListing from "./pages/JobListing";
import PostDetail from "./pages/PostDetail";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Me from "./pages/Me";
import Applicants from "./pages/Applicants";

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<JobListing />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/me" element={<Me />} />
        <Route path="/posts/:id/applicants" element={<Applicants />} />
      </Routes>
    </>
  );
}
