import Layout from "./Layout.jsx";

import AuthCallback from "./AuthCallback";

import AdminDashboard from "./AdminDashboard";

import PostJob from "./PostJob";

import PostJobWithAI from "./PostJobWithAI";

import CompanyDashboard from "./CompanyDashboard";

import FindTalent from "./FindTalent";

import Applications from "./Applications";

import JobseekerDashboard from "./JobseekerDashboard";

import BrowseJobs from "./BrowseJobs";

import MyApplications from "./MyApplications";

import Profile from "./Profile";

import Pricing from "./Pricing";

import Home from "./Home";

import PaymentSuccess from "./PaymentSuccess";

import PaymentCancel from "./PaymentCancel";

import ProfileBuilder from "./ProfileBuilder";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    AuthCallback: AuthCallback,
    
    AdminDashboard: AdminDashboard,
    
    PostJob: PostJob,

    PostJobWithAI: PostJobWithAI,
    
    CompanyDashboard: CompanyDashboard,
    
    FindTalent: FindTalent,
    
    Applications: Applications,
    
    JobseekerDashboard: JobseekerDashboard,
    
    BrowseJobs: BrowseJobs,
    
    MyApplications: MyApplications,
    
    Profile: Profile,
    
    Pricing: Pricing,
    
    Home: Home,
    
    PaymentSuccess: PaymentSuccess,
    
    PaymentCancel: PaymentCancel,
    
    ProfileBuilder: ProfileBuilder,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<AuthCallback />} />
                
                
                <Route path="/AuthCallback" element={<AuthCallback />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/PostJob" element={<PostJob />} />

                <Route path="/PostJobWithAI" element={<PostJobWithAI />} />
                
                <Route path="/CompanyDashboard" element={<CompanyDashboard />} />
                
                <Route path="/FindTalent" element={<FindTalent />} />
                
                <Route path="/Applications" element={<Applications />} />
                
                <Route path="/JobseekerDashboard" element={<JobseekerDashboard />} />
                
                <Route path="/BrowseJobs" element={<BrowseJobs />} />
                
                <Route path="/MyApplications" element={<MyApplications />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Pricing" element={<Pricing />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/PaymentSuccess" element={<PaymentSuccess />} />
                
                <Route path="/PaymentCancel" element={<PaymentCancel />} />
                
                <Route path="/ProfileBuilder" element={<ProfileBuilder />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}