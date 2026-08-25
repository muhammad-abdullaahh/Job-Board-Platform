import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCompanyDetailApi } from '../api/companiesApi';

export const CompanyDetailPage = () => {
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyDetailApi(companyId)
      .then((data) => {
        setCompany(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [companyId]);

  if (loading) return <div className="page-container"><p>Loading company profile...</p></div>;
  if (!company) return <div className="page-container"><p>Company not found.</p></div>;

  return (
    <div className="page-container company-detail-page">
      <h1>{company.name}</h1>
      <p className="location">{company.location}</p>
      <p className="description">{company.description}</p>
    </div>
  );
};

export default CompanyDetailPage;
