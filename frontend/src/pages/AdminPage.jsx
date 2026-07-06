import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import OverviewTab from './admin/OverviewTab';
import UsersTab from './admin/UsersTab';
import CoursesTab from './admin/CoursesTab';
import ShopPricesTab from './admin/ShopPricesTab';
import InstructorsTab from './admin/InstructorsTab';

const SECTION_LABELS = {
    '/admin': 'Overview',
    '/admin/users': 'User Management',
    '/admin/courses': 'Course Management',
    '/admin/instructors': 'Instructors',
    '/admin/shop': 'Shop Prices',
};

const AdminPage = () => {
    const location = useLocation();
    const section = SECTION_LABELS[location.pathname] ?? 'Admin';

    return (
        <AdminLayout section={section}>
            <Routes>
                <Route index element={<OverviewTab />} />
                <Route path="users" element={<UsersTab />} />
                <Route path="courses" element={<CoursesTab />} />
                <Route path="instructors" element={<InstructorsTab />} />
                <Route path="shop" element={<ShopPricesTab />} />
            </Routes>
        </AdminLayout>
    );
};

export default AdminPage;
