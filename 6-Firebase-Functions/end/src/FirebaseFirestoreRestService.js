import firebase from "./FirebaseConfig";

const auth = firebase.auth();

const BASE_URL = process.env.REACT_APP_CLOUD_FIRESTORE_FUNCTION_API_URL;

const createDocument = async (collection, document) => {
  let token;

  try {
    token = await auth.currentUser.getIdToken();
  } catch (error) {
    alert(error.message);
    throw error;
  }

  try {
    const response = await fetch(`${BASE_URL}/${collection}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(document),
    });

    if (response.status !== 201) {
      const errorMessage = await response.text();
      const error = { message: errorMessage };

      throw error;
    }

    return response.json();
  } catch (error) {
    alert(error.message);
    throw error;
  }
};

const readDocuments = async ({
  collection,
  queries,
  orderByField,
  orderByDirection,
  perPage,
  pageNumber,
}) => {
  try {
    const url = new URL(`${BASE_URL}/${collection}`);

    for (const query of queries) {
      url.searchParams.append(query.field, query.value);
    }

    if (orderByField) {
      url.searchParams.append("orderByField", orderByField);
    }

    if (orderByDirection) {
      url.searchParams.append("orderByDirection", orderByDirection);
    }

    if (perPage) {
      url.searchParams.append("perPage", perPage);
    }

    if (pageNumber) {
      url.searchParams.append("pageNumber", pageNumber);
    }

    let token;

    try {
      token = await auth.currentUser.getIdToken();
    } catch (error) {
      // continue.
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 200) {
      const errorMessage = await response.text();
      const error = { message: errorMessage };

      throw error;
    }

    return response.json();
  } catch (error) {
    alert(error.message);
    throw error;
  }
};

const updateDocument = async (collection, id, document) => {
  let token;

  try {
    token = await auth.currentUser.getIdToken();
  } catch (error) {
    alert(error.message);
    throw error;
  }

  try {
    const response = await fetch(`${BASE_URL}/${collection}/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(document),
    });

    if (response.status !== 200) {
      const errorMessage = await response.text();
      const error = { message: errorMessage };

      throw error;
    }

    return response.json();
  } catch (error) {
    alert(error.message);
    throw error;
  }
};

const deleteDocument = async (collection, id) => {
  let token;

  try {
    token = await auth.currentUser.getIdToken();
  } catch (error) {
    alert(error.message);
    throw error;
  }

  try {
    const response = await fetch(`${BASE_URL}/${collection}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      const errorMessage = await response.text();
      const error = { message: errorMessage };

      throw error;
    }
  } catch (error) {
    alert(error.message);
    throw error;
  }
};

const FirebaseFirestoreRestService = {
  createDocument,
  readDocuments,
  updateDocument,
  deleteDocument,
};

export default FirebaseFirestoreRestService;
