import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography
} from '@mui/material';
import GoogleSheetsConnect from './GoogleSheetsConnect';
import SpreadsheetConfig from './SpreadsheetConfig';

const steps = ['Connect to Google Sheets', 'Configure Spreadsheet', 'Review & Finish'];

const DataSourceManager = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState(null);
  const [dataSource, setDataSource] = useState(null);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSpreadsheetSelected = (spreadsheet) => {
    setSelectedSpreadsheet(spreadsheet);
    handleNext();
  };

  const handleConfigured = (configuredDataSource) => {
    setDataSource(configuredDataSource);
    handleNext();
  };

  const handleFinish = () => {
    onComplete && onComplete(dataSource);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 2 }}>
        {activeStep === 0 && (
          <GoogleSheetsConnect onConnected={handleSpreadsheetSelected} />
        )}

        {activeStep === 1 && (
          <SpreadsheetConfig
            spreadsheet={selectedSpreadsheet}
            onConfigured={handleConfigured}
          />
        )}

        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Configuration Complete
            </Typography>
            <Typography color="text.secondary" paragraph>
              Your Google Sheets data source has been configured successfully.
              You can now use this data source to send emails.
            </Typography>
            <Button
              variant="contained"
              onClick={handleFinish}
              sx={{ mt: 2 }}
            >
              Start Using Data Source
            </Button>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DataSourceManager; 