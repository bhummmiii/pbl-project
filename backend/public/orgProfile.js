// ================== SAVE PROFILE ==================
document.getElementById("orgProfileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  if (!token) {
    alert("❌ You must be logged in to save your profile.");
    return;
  }

  const formData = new FormData();
  formData.append("contact", document.getElementById("orgContact").value.trim());
  formData.append("hours", document.getElementById("orgHours").value.trim());
  formData.append("address", document.getElementById("orgAddress").value.trim());

  // Logo (single file)
  const logoFile = document.getElementById("logo").files[0];
  if (logoFile) formData.append("logo", logoFile);

  // Company Images (multiple files)
  const companyFiles = document.getElementById("companyImages").files;
  for (let i = 0; i < companyFiles.length; i++) {
    formData.append("companyImages", companyFiles[i]);
  }

  try {
    const res = await fetch("/api/organizations/profile", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    if (data.success) {
      alert("✅ Profile saved successfully!");
      console.log("Saved Org:", data.profile);
      populateForm(data.profile);
    } else {
      alert("❌ Failed to save profile: " + (data.message || "Unknown error"));
      console.error("Error response:", data);
    }
  } catch (err) {
    console.error("❌ Error submitting form:", err);
    alert("Server error while saving profile");
  }
});

// ================== VIEW PROFILE ==================
async function viewProfile() {
  const token = localStorage.getItem("token");
  const orgId = localStorage.getItem("organizationId");
  if (!token || !orgId) {
    alert("❌ You must be logged in to view the profile.");
    return;
  }

  try {
    const res = await fetch(`/api/organizations/profile/${orgId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();
    if (!data.success || !data.profile) {
      alert("⚠️ No profile found!");
      return;
    }

    const org = data.profile;

    document.getElementById("viewName").textContent = org.name || "";
    document.getElementById("viewContact").textContent = org.contact || "";
    document.getElementById("viewHours").textContent = org.hours || "";
    document.getElementById("viewAddress").textContent = org.address || "";

    const logoEl = document.getElementById("viewLogo");
    if (org.logo) {
      logoEl.src = org.logo;
      logoEl.style.display = "block";
    } else {
      logoEl.style.display = "none";
    }

    const imagesContainer = document.getElementById("viewCompanyImages");
    imagesContainer.innerHTML = "";
    if (org.companyImages && org.companyImages.length > 0) {
      org.companyImages.forEach(img => {
        const imageEl = document.createElement("img");
        imageEl.src = img;
        imageEl.classList.add("preview-img");
        imagesContainer.appendChild(imageEl);
      });
    }

    const modal = new bootstrap.Modal(document.getElementById("viewProfileModal"));
    modal.show();
    populateForm(org);
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    alert("Failed to fetch organization profile");
  }
}

function populateForm(org) {
  document.getElementById("orgName").value = org.name || "";
  document.getElementById("orgContact").value = org.contact || "";
  document.getElementById("orgHours").value = org.hours || "";
  document.getElementById("orgAddress").value = org.address || "";
}

document.getElementById("viewProfileBtn").addEventListener("click", viewProfile);

// ======================================================================
// ✅ USER REQUESTS SECTION (Updated to show Device requests for this Org)
// ======================================================================
document.addEventListener("DOMContentLoaded", () => {
  loadOrganizationDevices();
});

async function loadOrganizationDevices() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("⚠️ Not logged in. Cannot fetch devices.");
    return;
  }

  try {
    const res = await fetch("/api/organizations/devices", {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();
    if (!data.success || !data.devices || data.devices.length === 0) {
      console.warn("⚠️ No devices found for this organization.");
      document.getElementById("userRequestsTable").innerHTML =
        "<tr><td colspan='12' class='text-center text-muted'>No user requests found.</td></tr>";
      return;
    }

    const table = document.getElementById("userRequestsTable");
    table.innerHTML = "";

    data.devices.forEach(device => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${device.fullName}</td>
        <td>${device.phoneNumber}</td>
        <td>${device.address}</td>
        <td>${device.pickupTime ? new Date(device.pickupTime).toLocaleString() : "--"}</td>
        <td>${device.deviceType}</td>
        <td>${device.brandModel}</td>
        <td>${device.condition}</td>
        <td>${device.purchaseYear}</td>
        <td>
          ${["front", "side", "top"].map(key => 
            device.images?.[key]
              ? `<img src="${device.images[key]}" class="preview-img" 
                  data-bs-toggle="modal" data-bs-target="#deviceImageModal"
                  onclick="showDeviceImages(['${device.images[key]}'])">`
              : ""
          ).join("") || "No Images"}
        </td>
        <td>
          <select class="form-select status-dropdown" data-device-id="${device._id}">
            <option value="Accept" ${device.status === "Accept" ? "selected" : ""}>Accept</option>
            <option value="Under Review" ${device.status === "Under Review" ? "selected" : ""}>Under Review</option>
            <option value="Pickup Pending" ${device.status === "Pickup Pending" ? "selected" : ""}>Pickup Pending</option>
            <option value="On the Way" ${device.status === "On the Way" ? "selected" : ""}>On the Way</option>
            <option value="At Recycling Center" ${device.status === "At Recycling Center" ? "selected" : ""}>At Recycling Center</option>
            <option value="Disposed" ${device.status === "Disposed" ? "selected" : ""}>Disposed</option>
          </select>
        </td>
        <td>
          <select class="form-select delivery-dropdown" data-device-id="${device._id}" style="display:none;">
            <option value="">-- Select Delivery Boy --</option>
            <option value="Rahul">Rahul</option>
            <option value="Amit">Amit</option>
            <option value="Sneha">Sneha</option>
          </select>
        </td>
        <td>
          <button class="btn btn-primary btn-sm submit-btn" data-device-id="${device._id}">Submit</button>
        </td>
      `;
      table.appendChild(row);
    });

    attachDeviceEventListeners();
  } catch (err) {
    console.error("❌ Error fetching organization devices:", err);
  }
}

function showDeviceImages(images) {
  const container = document.getElementById("deviceImagesContainer");
  container.innerHTML = "";
  images.forEach(img => {
    const imageElement = document.createElement("img");
    imageElement.src = img;
    imageElement.className = "img-fluid rounded shadow";
    imageElement.style.maxHeight = "250px";
    container.appendChild(imageElement);
  });
}

// ✅ Event listeners for dropdowns and submit buttons
function attachDeviceEventListeners() {
  document.querySelectorAll(".status-dropdown").forEach(dropdown => {
    dropdown.addEventListener("change", e => {
      const deviceId = e.target.dataset.deviceId;
      const status = e.target.value;

      const deliveryDropdown = document.querySelector(`.delivery-dropdown[data-device-id='${deviceId}']`);
      if (status === "On the Way") {
        deliveryDropdown.style.display = "block";
      } else {
        deliveryDropdown.style.display = "none";
        deliveryDropdown.value = "";
      }
    });
  });

  document.querySelectorAll(".submit-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      const deviceId = e.target.dataset.deviceId;
      const status = document.querySelector(`.status-dropdown[data-device-id='${deviceId}']`).value;
      const deliveryBoy = document.querySelector(`.delivery-dropdown[data-device-id='${deviceId}']`).value;

      try {
        // Step 1: Update status
        const resStatus = await fetch(`/api/devices/${deviceId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ status })
        });

        const statusData = await resStatus.json();
        if (!resStatus.ok) {
          alert("❌ Failed to update status: " + (statusData.message || "Unknown error"));
          return;
        }

        // Step 2: Assign delivery boy if applicable
        if (status === "On the Way" && deliveryBoy) {
          const resAssign = await fetch(`/api/devices/${deviceId}/assign`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ deliveryBoy })
          });

          const assignData = await resAssign.json();
          if (!resAssign.ok) {
            alert("⚠️ Status updated but delivery not assigned: " + (assignData.message || "Error"));
          }
        }

        alert("✅ Request updated successfully!");
        loadOrganizationDevices(); // refresh table
      } catch (err) {
        console.error("❌ Error updating device:", err);
        alert("Server error while updating device");
      }
    });
  });
}
