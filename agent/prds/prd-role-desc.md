一、账号与角色权限说明
当前系统拥有者是聚货通公司，使用者包含：聚货通-超级管理员、聚货通-领导、聚货通-物流主管、聚货通-物流操作员、聚货通-财务主管、聚货通-财务人员、聚货通-报关人员、聚货通-销售人员、聚货通-运营人员、聚货通的客户、供应商公司-领导、供应商公司-主管、供应商公司-员工、代理商公司-领导、代理商公司-主管、代理商公司-员工、代理商公司-客户。
本系统有角色权限、使用者分类、数据权限三大
1.超级管理员------------特殊用户拥有此角色权限
拥有一切操作权限
2.聚货通-领导-----------使用






二、示例图

结构图
```
graph TD
    A([用户发起请求: 获取订单列表]) --> B{1. 验证功能权限 RBAC}
    
    B -- 否: 无权限 --> C[报 403 错误/无权访问]
    B -- 是: 有权限 --> D{2. 识别用户类型 User Type}
    
    D -- 内部员工 --> E[锁死在公司内部组织树 Company Org Tree]
    D -- 外部客户/供应商/代理 --> F[锁死在关联的企业ID External Partner ID]
    
    E --> G{3. 读取数据范围标签 Data Scope}
    F --> G
    
    G -- 全系统 --> H[SQL 语句不加组织限制 <br>直接查询全表]
    G -- 本部门/本公司 --> I[递归获取当前组织节点 <br>及所有子节点的 ID 集合]
    G -- 个人 --> J[限制仅能看 <br>Creator_ID 或 Owner_ID]
    
    H --> K[4. 动态拼接 SQL 并返回数据]
    I --> K
    J --> K
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style C fill:#ff9999,stroke:#333,stroke-width:1px
    style K fill:#99ff99,stroke:#333,stroke-width:2px
```


时序图
```
sequenceDiagram
    autonumber
    actor 前端 as 前端/客户端
    participant 网关 as 网关/鉴权中心
    participant 后端 as 业务后端服务
    participant 数据库 as 数据库 (DB)

    前端->>网关: 携带 Token 请求订单列表
    note over 网关: 校验 Token 并解析出：<br/>User_ID = 101<br/>Role = 销售主管<br/>Org_ID = 销一部<br/>Scope = 本部门
    网关->>后端: 转发请求 (将上述参数注入请求头)
    
    rect rgb(240, 245, 255)
        note over 后端: 逻辑处理：<br/>递归查询“销一部”下的<br/>所有子部门和下属员工 ID
        后端->>后端: 获到下属 ID 集合 (101, 102, 103)
    end
    
    note over 后端: 动态拼接 SQL 语句:<br/>SELECT * FROM 订单<br/>WHERE owner_id IN (101, 102, 103)
    后端->>数据库: 执行加密/过滤后的 SQL 查询
    数据库-->>后端: 返回过滤后的订单数据集
    后端-->>前端: 返回 JSON 数据（主管成功看到下属数据）
```