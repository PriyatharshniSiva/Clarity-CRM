import React from 'react';
import AdvancedLeaveFilterSuite from '../leave/AdvancedLeaveFilterSuite';

const SuperAdminLeaveAnalytics = ({ leaves = [], onRefresh }) => {
  return (
    <AdvancedLeaveFilterSuite
      leaves={leaves}
      userRole="SUPER_ADMIN"
      onRefresh={onRefresh}
    />
  );
};

export default SuperAdminLeaveAnalytics;
