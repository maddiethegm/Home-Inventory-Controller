Here's a schema representation using industry-standard documentation practices:

---

## **InventoryApp - Database Schema Documentation**

### **ER Diagram (Mermaid Format)**

```mermaid
erDiagram
    GROUPS ||--o{ ROLES : "belongs to group"
    GROUPS ||--o{ USERS : "assigned to user"
    LOCATIONS ||--o{ ITEMS : "contains items"
    LOCATIONS }|--|| USERS : "owned by"
    USERS ||--o{ ITEMS : "owns items"
    ROLES ||--o| USERS : "has role"
    GROUPS ||--o| GROUPS : "parent group"
    ITEMS ||--o| ITEMS : "parent item"
    LOCATIONS ||--o| LOCATIONS : "parent location"
    ROLES ||--o| ROLES : "parent role"

    GROUPS {
        uniqueidentifier ID PK
        nvarchar(50) Name
        nvarchar(255) Description
        tinyint Number
        uniqueidentifier parentGroup FK
        nvarchar(1000) Bio
    }

    ROLES {
        uniqueidentifier ID PK
        nvarchar(50) Name
        nvarchar(255) Description
        tinyint Number
        uniqueidentifier parentRole FK
        uniqueidentifier parentGroup FK
    }

    USERS {
        uniqueidentifier ID PK
        nvarchar(50) Username UK
        nvarchar(255) PasswordHash
        nvarchar(50) Role
        bit SQL_USER
        nvarchar(50) Email
        nvarchar(50) DisplayName
        varchar(max) AvatarURL
        nvarchar(50) uiTheme
        nvarchar(50) Team
        nvarchar(1000) Bio
        uniqueidentifier primaryGroup FK
        varchar(max) groupString
        nvarchar(50) type
        uniqueidentifier primaryRole FK
        varchar(max) roleString
    }

    LOCATIONS {
        uniqueidentifier ID PK
        nvarchar(50) Name UK
        nvarchar(255) Description
        nvarchar(50) Building
        nvarchar(50) Owner
        text Image
        uniqueidentifier parentLoc FK
        uniqueidentifier parentItem FK
        uniqueidentifier ownerId FK
    }

    ITEMS {
        uniqueidentifier ID PK UK
        nvarchar(50) Name
        nvarchar(255) Description
        nvarchar(50) Location
        nvarchar(50) Bin
        smallint Quantity
        bit IsOutOfStock
        varchar(255) Image
        nvarchar(50) Owner
        uniqueidentifier parentLoc FK
        uniqueidentifier parentItem FK
        uniqueidentifier ownerId FK
    }

    TRANSACTIONS {
        uniqueidentifier ID PK DF(newid())
        nvarchar(50) AuthenticatedUsername
        nvarchar(255) Route
        varchar(max) RequestPayload
        datetime2(7) Timestamp DF(getdate())
    }
```

---

### **Table Documentation**

| Table | Purpose | Primary Key | Indexes | Foreign Keys |
|-------|---------|-------------|---------|--------------|
| **Groups** | Group hierarchy (teams, departments, etc.) | `ID` | - | → Self via `parentGroup` |
| **Items** | Inventory items/products | `ID`, `Name` (UNIQUE) | 1 clustered | → Locations, Items, Users |
| **Locations** | Physical locations/stores | `ID`, `Name` (UNIQUE DESC) | 1 clustered | → Self, Items, Users |
| **Roles** | User roles/permissions | `ID` | - | → Roles, Groups |
| **Users** | Application users/accounts | `ID`, `Username` (UNIQUE DESC) | 1 clustered | → Groups, Roles |
| **Transactions** | Audit trail/log | `ID` (DF=NEWID()) | 1 clustered | - |

---

### **Relationship Mapping**

```mermaid
graph TD
    A[GROUPS] --> B{Groups}
    C[USERS] --> D{Users}
    E[LOCATIONS] --> F{Locations}
    G[ITEMS] --> H{Items}
    I[ROLES] --> J{Roles}
    
    subgraph Groups Relationships
        A -.->|1:N| B:::recursive
        C .-.->|1:N| D:::many-to-one
        E .-.->|N:M| F:::many-to-many
    end
    
    subgraph Cross-Table
        C --> A:::one-to-many
        C --> I:::one-to-many
        G --> E:::many-to-one
        G --> I:::one-to-many
        G --> C:::many-to-one
    end

    class recursive fill:#e1f5fe,stroke:#01579b;
```

---

### **Cardinality Summary**

| From Table | To Table | Relationship Type | FK Column | Notes |
|------------|----------|-------------------|-----------|-------|
| Groups | Groups | Self-reference (1:1) | `parentGroup` | Recursive hierarchy |
| Roles | Roles | Self-reference (1:1) | `parentRole` | Recursive hierarchy |
| Locations | Items | 1:N | N/A | Each item belongs to one location |
| Users | Items | 1:N | `ownerId` | User owns items |
| Groups | Users | 1:N | `primaryGroup` | User belongs to one group |
| Roles | Users | 1:N | `primaryRole` | User has one role |
| Locations | Locations | Self-reference (1:1) | `parentLoc` | Hierarchical locations |

---

### **Design Notes**

1. **Recursive Tables**: Groups, Roles, Locations, Items all have self-referential capabilities via parent columns
2. **Identity Columns**: Primary keys use `uniqueidentifier` (GUIDs) - appropriate for distributed systems
3. **User Management**: Users can be linked to multiple external user types via `groupString`, `roleString`, `SQL_USER` flags
4. **Location Hierarchy**: Supports nested locations and parent-child relationships
5. **Audit Trail**: Transactions table captures API routes with payload and timestamps

---

### **Foreign Key Naming Convention**

| Pattern | Example | Description |
|---------|---------|-------------|
| `{Child}_{Parent}1` | `FK_Items_Locations1` | Links items to locations |
| `{Child}_{Self}2` | `FK_Items_Items2` | Self-referential link |

---

This documentation follows standard database design practices and can be used for future development, code review, or migration planning.