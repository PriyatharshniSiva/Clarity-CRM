import React from 'react';
import AdvancedLeaveFilterSuite from '../leave/AdvancedLeaveFilterSuite';

const AdminLeaveManagement = ({ leaves = [], onRefresh }) => {
  return (
    <AdvancedLeaveFilterSuite
      leaves={leaves}
      userRole="ADMIN"
      onRefresh={onRefresh}
    />
  );
};

export default AdminLeaveManagement;
