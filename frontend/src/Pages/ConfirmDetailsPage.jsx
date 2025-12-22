import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Paper,
  Container,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import {
  AddCircleOutline,
  Delete,
  WarningAmber,
  CheckCircle,
  ErrorOutline,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const ConfirmDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const custId = location.state?.cust_id || null;
  const uploadedFiles = location.state?.uploadedFiles || [];
  const documentsFromBackend = location.state?.extractedData || [];

  const [documents, setDocuments] = useState(
    documentsFromBackend.map((doc) => ({
      fields: { ...doc }, // flat key-value object
    }))
  );

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDocIndex, setModalDocIndex] = useState(null);
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  const [nameConflictOpen, setNameConflictOpen] = useState(false);
  const user_id = useContext(AuthContext).userId;
  const [resultModal, setResultModal] = useState({
    open: false,
    success: true,
    message: "",
  });

  const handleFieldChange = (docIndex, field, value, isExtra = false) => {
    const updated = [...documents];
    if (isExtra) {
      updated[docIndex].extraFields[field.index][field.keyOrValue] = value;
    } else {
      if (!updated[docIndex].named_entities)
        updated[docIndex].named_entities = {};
      updated[docIndex].named_entities[field] = value;
    }
    setDocuments(updated);
  };

  const handleAddFieldModal = (docIndex) => {
    setModalDocIndex(docIndex);
    setNewFieldKey("");
    setNewFieldValue("");
    setModalOpen(true);
  };

  const handleAddField = () => {
    if (!newFieldKey.trim()) return;

    const updated = [...documents];
    updated[modalDocIndex].fields[newFieldKey] = newFieldValue;

    setDocuments(updated);
    setModalOpen(false);
  };

  const handleDeleteField = (docIndex, keyOrIndex, isExtra = false) => {
    const updated = [...documents];
    if (isExtra) {
      updated[docIndex].extraFields.splice(keyOrIndex, 1);
    } else {
      delete updated[docIndex].named_entities[keyOrIndex];
    }
    setDocuments(updated);
  };

  const hasNameConflict = () => {
    const names = documents
      .map((doc) => doc.fields?.name)
      .filter(Boolean)
      .map((n) => n.trim().toLowerCase());

    return new Set(names).size > 1;
  };

  const handleConfirm = () => {
    if (hasNameConflict()) {
      setNameConflictOpen(true);
      return;
    }
    handleSave();
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const endpoint = custId
        ? "http://localhost:8080/api/saveDetailsExisting"
        : "http://localhost:8080/api/saveDetails";

      const formData = new FormData();

      const entitiesPayload = documents.map((doc) => doc.fields);

      formData.append("entities", JSON.stringify(entitiesPayload));
      formData.append("user_id", user_id);

      if (custId) {
        formData.append("cust_id", custId);
      }

      const response = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        setResultModal({
          open: true,
          success: true,
          message: "Successfully saved!",
          type: "save",
        });
      }
    } catch (err) {
      console.error("Failed to save:", err);
      setResultModal({
        open: true,
        success: false,
        message: "Error saving data. Try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!documents.length) {
    return (
      <Container
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f8f8",
          textAlign: "center",
        }}
      >
        <Box>
          <WarningAmber sx={{ fontSize: 80, color: "#FF9800" }} />
          <Typography variant="h5" sx={{ mt: 2, fontWeight: "bold" }}>
            No Data to Display
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            It seems no extracted details were found. Please try uploading a
            document again.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ padding: 4, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <CircularProgress color="inherit" />
        </Box>
      )}

      <Typography
        variant="h4"
        sx={{ fontWeight: "bold", marginBottom: 4, fontFamily: "Oswald" }}
      >
        Confirm Your KYC Details
      </Typography>

      {custId && (
        <Typography
          variant="h6"
          sx={{ mb: 2, fontWeight: "bold", color: "#444" }}
        >
          Customer ID: {custId}
        </Typography>
      )}

      {uploadedFiles.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{ mb: 1, fontWeight: "bold", color: "#444" }}
          >
            Uploaded Files:
          </Typography>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index}>
                <Typography variant="body1">{file.name}</Typography>
              </li>
            ))}
          </ul>
        </Box>
      )}

      {documents.map((doc, index) => {
        const fields = doc.fields;
        const docType = fields.document_type || "Unknown";

        return (
          <Paper
            key={index}
            elevation={4}
            sx={{
              padding: 3,
              borderRadius: 2,
              backgroundColor: "#ffffff",
              marginBottom: 4,
            }}
          >
            <Typography
              variant="h6"
              sx={{ marginBottom: 2, fontWeight: "bold", color: "#FF5722" }}
            >
              Document {index + 1} - {docType}
            </Typography>

            <Grid container spacing={2}>
              {Object.entries(fields).map(([key, value]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <TextField
                    label={key.replace(/_/g, " ")}
                    value={value ?? ""}
                    onChange={(e) => {
                      const updated = [...documents];
                      updated[index].fields[key] = e.target.value;
                      setDocuments(updated);
                    }}
                    fullWidth
                  />
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                startIcon={<AddCircleOutline />}
                onClick={() => handleAddFieldModal(index)}
                variant="outlined"
              >
                Add Field
              </Button>
            </Box>
          </Paper>
        );
      })}

      <Box sx={{ marginTop: 4, textAlign: "center" }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleConfirm}
        >
          Confirm & Continue
        </Button>
      </Box>

      {/* Add Field Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>Add New Field</DialogTitle>
        <DialogContent>
          <TextField
            label="Field Name"
            value={newFieldKey}
            onChange={(e) => setNewFieldKey(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
          <TextField
            label="Value"
            value={newFieldValue}
            onChange={(e) => setNewFieldValue(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddField}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Name Conflict Warning Dialog */}
      <Dialog
        open={nameConflictOpen}
        onClose={() => setNameConflictOpen(false)}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmber sx={{ color: "#FF9800" }} />
          Name Conflict Detected
        </DialogTitle>

        <DialogContent>
          <Typography>
            The <strong>name</strong> field differs across uploaded documents.
            <br />
            <br />
            Please ensure this is correct before continuing.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setNameConflictOpen(false)}>Review</Button>

          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setNameConflictOpen(false);
              handleSave(); // user confirms
            }}
          >
            Continue Anyway
          </Button>
        </DialogActions>
      </Dialog>

      {/* Result Modal */}
      <Dialog
        open={resultModal.open}
        onClose={() => setResultModal({ ...resultModal, open: false })}
        PaperProps={{ sx: { p: 3, textAlign: "center" } }}
      >
        <DialogContent>
          {resultModal.success ? (
            <CheckCircle sx={{ fontSize: 60, color: "#4CAF50", mb: 2 }} />
          ) : (
            <ErrorOutline sx={{ fontSize: 60, color: "#F44336", mb: 2 }} />
          )}
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
            {resultModal.success ? "Success" : "Attention"}
          </Typography>
          <Typography>{resultModal.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button
            variant="contained"
            onClick={() => {
              setResultModal({ ...resultModal, open: false });
              if (resultModal.success && resultModal.type === "save")
                navigate("/");
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfirmDetailsPage;
