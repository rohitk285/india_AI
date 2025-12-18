import React, { useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Dialog,
  DialogContent,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
  useMediaQuery,
} from "@mui/material";
import { CloudUpload, CheckCircle, Cancel } from "@mui/icons-material";
import axios from "axios";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

const UploadPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ files: [], cust_id: "" });
  const [customerType, setCustomerType] = useState("new");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsTimer, setSuggestionsTimer] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [alert, setAlert] = useState({
    open: false,
    success: false,
    message: "",
  });
  const username = useContext(AuthContext).username;
  const user_id = useContext(AuthContext).userId;
  const isMobile = useMediaQuery("(max-width: 600px)");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { files } = e.target;
    setFormData({
      ...formData,
      files: [...formData.files, ...Array.from(files)],
    });
  };

  const handleCustomerType = (event, newType) => {
    if (newType !== null) setCustomerType(newType);
  };

  const fetchSuggestions = async (q) => {
    if (!q || q.trim() === "") {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);

    try {
      const res = await axios.post("http://localhost:8080/api/custID", {
        cust_id: encodeURIComponent(q.trim()),
        user_id: user_id,
      });
      if (res.status !== 200) {
        setSuggestions([]);
        return;
      }

      const opts = res.data
        .map((item) => {
          try {
            const parsed = typeof item === "string" ? JSON.parse(item) : item;
            const id = parsed._id?.$oid || parsed._id || parsed.cust_id;
            const name = parsed.name || parsed.Name || "";
            if (!id) return null;
            return { cust_id: id, name };
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      setSuggestions(opts);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (customerType === "existing" && !formData.cust_id.trim()) {
        setAlert({
          open: true,
          success: false,
          message: "Please enter Customer ID",
        });
        setTimeout(
          () => setAlert({ open: false, success: false, message: "" }),
          3000
        );
        return;
      }

      const formDataToSend = new FormData();
      formData.files.forEach((file) => formDataToSend.append("file", file));
      if (customerType === "existing") {
        formDataToSend.append("cust_id", formData.cust_id);
      }

      const response = await fetch("http://localhost:8080/api/details", {
        method: "POST",
        body: formDataToSend,
      });
      const result = await response.json();

      if (response.ok) {
        navigate("/confirm-details", {
          state: {
            extractedData: result.data,
            cust_id: customerType === "existing" ? formData.cust_id : null,
            uploadedFiles: formData.files,
          },
        });
      } else {
        setAlert({
          open: true,
          success: false,
          message: result.message || "Something went wrong.",
        });
      }
    } catch {
      setAlert({ open: true, success: false, message: "Server Error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert({ open: false, success: false, message: "" });
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #000000 60%, #FE8D01 140%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: { xs: 2, sm: 4 },
        }}
      >
        <Box
          sx={{
            width: { xs: "100%", sm: "90%", md: "60%", lg: "45%" },
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              position: "absolute",
              top: 100,
              left: 50,
              fontSize: "28px",
              fontWeight: "bold",
              fontFamily: "Oswald",
              color: "#fff",
              letterSpacing: "0.5px",
            }}
          >
            Welcome {username}!
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", fontFamily: "Oswald", mb: 2 }}
          >
            Upload Your Documents
          </Typography>

          {/* Customer Type */}
          <ToggleButtonGroup
            value={customerType}
            exclusive
            onChange={handleCustomerType}
            aria-label="customer-type"
            sx={{
              mb: 2,
              backgroundColor: "rgba(255,255,255,0.9)",
              borderRadius: "15px",
              p: 0.5,
              display: "flex",
              justifyContent: "center",
              boxShadow: "0 0 10px rgba(254,141,1,0.3)",
            }}
          >
            {["new", "existing"].map((type) => (
              <ToggleButton
                key={type}
                value={type}
                sx={{
                  color: "#333",
                  textTransform: "capitalize",
                  fontWeight: "bold",
                  fontSize: "16px",
                  px: 3,
                  py: 1,
                  borderRadius: "10px !important",
                  border: "none",
                  transition: "0.2s ease-in-out",
                  "&.Mui-selected": {
                    backgroundColor: "#FE8D01 !important",
                    color: "#fff !important",
                    boxShadow: "0 0 10px rgba(254,141,1,0.6)",
                  },
                }}
              >
                {type === "new" ? "New Customer" : "Existing Customer"}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {customerType === "existing" && (
            <Box sx={{ width: "100%", maxWidth: "600px" }}>
              <Autocomplete
                freeSolo
                fullWidth
                options={suggestions || []}
                getOptionLabel={(opt) =>
                  typeof opt === "string"
                    ? opt
                    : `${opt.cust_id}`
                }
                loading={loadingSuggestions}
                onInputChange={(e, val) => {
                  if (suggestionsTimer) clearTimeout(suggestionsTimer);
                  const t = setTimeout(() => fetchSuggestions(val), 350);
                  setSuggestionsTimer(t);
                  setFormData({ ...formData, cust_id: val });
                }}
                onChange={(e, newVal) =>
                  setFormData({
                    ...formData,
                    cust_id:
                      typeof newVal === "string"
                        ? newVal
                        : newVal?.cust_id || "",
                  })
                }
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      p: 1.2,
                      borderBottom: "1px solid #eee",
                      "&:hover": { backgroundColor: "rgba(254,141,1,0.08)" },
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: "bold",
                        fontFamily: "monospace",
                        color: "#333",
                      }}
                    >
                      {option.cust_id}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#555",
                        fontFamily: "Oswald",
                        letterSpacing: "0.3px",
                      }}
                    >
                      {option.name || " "}
                    </Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer ID"
                    variant="outlined"
                    fullWidth
                    sx={{
                      backgroundColor: "#fff",
                      borderRadius: 1,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                      },
                    }}
                  />
                )}
              />
            </Box>
          )}

          {/* Upload Section */}
          <Box
            sx={{
              border: "2px dashed rgba(255,255,255,0.4)",
              borderRadius: "15px",
              p: 3,
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "rgba(255,255,255,0.05)",
              transition: "0.3s",
              width: "100%",
              "&:hover": {
                borderColor: "#FE8D01",
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
            onClick={() => fileInputRef.current.click()}
          >
            <CloudUpload sx={{ fontSize: 48, color: "#FE8D01" }} />
            <Typography sx={{ mt: 1, color: "#fff" }}>
              Click or drag files to upload (PDF , JPEG , JPG   , PNG)
            </Typography>
            <input
              type="file"
              hidden
              multiple
              accept=".pdf, .jpg, .jpeg, .png"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </Box>

          {/* Uploaded Files */}
          {formData.files.length > 0 && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                mt: 2,
                justifyContent: "center",
              }}
            >
              {formData.files.map((file, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    backgroundColor: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "20px",
                    px: 1.5,
                    py: 0.5,
                    color: "#fff",
                    fontSize: "13px",
                    fontFamily: "monospace",
                  }}
                >
                  <Typography
                    sx={{
                      maxWidth: "120px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        files: formData.files.filter((_, idx) => idx !== i),
                      })
                    }
                    sx={{
                      color: "#fff",
                      minWidth: "0",
                      p: 0,
                      fontSize: "14px",
                      "&:hover": { color: "#FE8D01" },
                    }}
                  >
                    ✕
                  </Button>
                </Box>
              ))}
            </Box>
          )}

          {/* Upload Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.files.length}
            sx={{
              mt: 3,
              backgroundColor: "#FE8D01",
              fontWeight: "bold",
              py: 1.2,
              borderRadius: "30px",
              "&.Mui-disabled": {
                backgroundColor: "#FFB668",
                color: "#fff",
              },
            }}
          >
            Upload
          </Button>
        </Box>
      </Box>

      {/* Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <Box sx={{ textAlign: "center", color: "#fff" }}>
            <CircularProgress sx={{ color: "#FE8D01" }} />
            <Typography sx={{ mt: 2 }}>Processing your upload...</Typography>
          </Box>
        </Box>
      )}

      {/* Alert Dialog */}
      <Dialog
        open={alert.open}
        onClose={handleCloseAlert}
        sx={{
          "& .MuiDialog-paper": {
            p: 4,
            borderRadius: "15px",
            minWidth: "300px",
          },
        }}
      >
        <DialogContent
          sx={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {alert.success ? (
            <CheckCircle sx={{ fontSize: 60, color: "green", mb: 2 }} />
          ) : (
            <Cancel sx={{ fontSize: 60, color: "red", mb: 2 }} />
          )}
          <Typography variant="h6">{alert.message}</Typography>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UploadPage;
