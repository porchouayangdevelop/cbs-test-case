class MySQLQueryBuilder {
  constructor() {
    this.init();
    // this.isTestMode = false;
    // this.testResults = [];
  }
  init() {
    this.withClauses = [];
    this.queryType = "query";
    this.params = [];
    this.tables = [];
    this.joins = [];
    this.conditions = [];
    this.fields = [];
    this.operators = [];
    this.having = [];
    this.concat = [];
    this.replace = [];
    this.max = [];
    this.min = [];
    this.sum = [];
    this.count = false;
    this.distinct = false;
    this.cast = [];
    this.convert = [];
    this.substring = [];
    this.locate = [];
    this.left = [];
    this.right = [];
    this.length = [];
    this.coalesce = [];
    this.contains = [];
    this.caseStatements = [];
    this.procedures = "";
    this.procedureParams = [];
    this.functions = "";
    this.functionParams = [];
    this.subqueries = [];
    this.groupBy = [];
    this.orderBy = [];
    this.limit = [];
    this.offset = [];
    return this;
  }

  enableTestMode() {
    this.isTestMode = true;
    this.testResults = [];
    return this;
  }

  disableTestMode() {
    this.isTestMode = false;
    return this;
  }

  getTestResults() {
    return this.testResults;
  }

  test() {
    const result = this.build();
    this.testResults.push({
      sql: result.query,
      params: result.params,
      timeStamp: Date.now(),
      queryType: this.queryType,
    });
    return result;
  }

  logState() {
    console.log({
      type: this.queryType,
      tables: this.tables,
      joins: this.joins,
      conditions: this.conditions,
      fields: this.fields,
      params: this.params,
    });
    return this;
  }

  validate() {
    const errors = [];

    if (this.queryType === "query" && this.queryType.length === 0) {
      errors.push("No tables specified for SELECT query");
    }

    if (this.queryType === "procedure" && !this.procedures) {
      errors.push("No procedures specified for PROCEDURE call");
    }

    if (this.queryType === "function" && !this.functions) {
      errors.push("No functions specified for FUNCTION call");
    }

    this.joins.forEach((join, index) => {
      if (!join.condition) {
        errors.push(`Join #${index + 1} missing condition`);
      }
    });

    this.conditions.forEach((condition, index) => {
      if (condition.type !== null && condition.value === undefined) {
        errors.push(`Condition #${index + 1} missing value`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  setType(type) {
    this.queryType = type;
    return this;
  }

  setProcedures(procedures, params = []) {
    this.procedures = procedures;
    this.procedureParams = params;
    return this;
  }

  setFunctions(functions, params = []) {
    this.functions = functions;
    this.functionParams = params;
    return this;
  }

  addWithClause(name, selectBuilder) {
    if (!name || typeof name !== "string") {
      throw new Error("Invalid with clause name");
    }

    if (!(selectBuilder instanceof MySQLQueryBuilder)) {
      throw new Error("selectBuilder must be an instance of MySQLQueryBuilder");
    }

    this.withClauses.push({
      name: name,
      selectBuilder: selectBuilder,
    });
  }

  addTables(tableName, alias = null) {
    this.tables.push({
      name: tableName,
      alias: alias,
    });
    return this;
  }

  addJoins(tableName, conditions, type = "INNER") {
    this.joins.push({
      table: tableName,
      conditions: conditions,
      type: type.toUpperCase(),
    });
    return this;
  }
  addSelect(fields) {
    if (Array.isArray(fields)) {
      this.fields = [...this.fields, ...fields];
    } else {
      this.fields.push(fields);
    }
    return this;
  }

  addConcat(fields, alias) {
    if (!Array.isArray(fields)) {
      throw new Error(`Concat fields must be an array`);
    }
    const concatStr = `CONCAT(${fields.join(", ' ', ")})`;
    this.addField(concatStr, alias);
    return this;
  }

  addReplace(field, oldValue, newValue, alias) {
    const replace = `REPLACE(${field}, ?, ?)`;
    this.params.push(oldValue, newValue);
    this.addField(replace, alias);
    return this;
  }

  addDateFormat(field, format, alias) {
    const dateFormat = `DATE_FORMAT(${field}, ?)`;
    this.params.push(format);
    this.addField(dateFormat, alias);
    return this;
  }

  addCast(field, type, alias) {
    const validTypes = [
      "char",
      "signed",
      "unsigned",
      "binary",
      "date",
      "time",
      "datetime",
      "timestamp",
      "decimal",
    ];
    type = type.toUpperCase();
    if (!validTypes.includes(type)) {
      throw new Error(
        `Invalid cast type. Must be one of: ${validTypes.join(", ")}`
      );
    }

    const cast = `cast(${fields} as ${type})`;
    this.addField(cast, alias);
    return this;
  }

  addConvert(field, toType, alias) {
    const validTypes = [
      "char",
      "signed",
      "unsigned",
      "binary",
      "date",
      "time",
      "datetime",
      "timestamp",
      "decimal",
      "json",
      "nchar",
    ];
    toType = toType.toUpperCase();
    if (!validTypes.includes(toType)) {
      throw new Error(
        `Invalid convert type. Must be one of: ${validTypes.join(", ")}`
      );
    }

    const convert = `CONVERT(${field} ${toType})`;
    this.addField(convert, alias);
    return this;
  }

  addSum(field, alias) {
    const sum = `SUM(${field})`;
    this.addField(sum, alias);
    return this;
  }

  addMax(field, alias) {
    const max = `MAX(${field})`;
    this.addField(max, alias);
    return this;
  }

  addMin(field, alias) {
    const min = `MIN(${field})`;
    this.addField(min, alias);
    return this;
  }

  addCount(field = "*", alias, distinct = false) {
    const countStr = distinct ? `COUNT(DISTINCT ${field})` : `COUNT(${field})`;
    this.addField(countStr, alias);
    return this;
  }

  addField(field, alias) {
    const fieldStr = alias ? `${field} AS ${alias}` : field;
    this.fields.push(fieldStr);
  }

  _formatValue(value) {
    if (typeof value === "string") {
      return `'${value}'`;
    } else if (value === null) {
      return "NULL";
    } else {
      return value;
    }
  }

  where(field, operator, value) {
    return this.addCondition(field, operator, value, "AND");
  }

  orWhere(field, operator, value) {
    return this.addCondition(field, operator, value, "OR");
  }

  whereIn(field, values) {
    if (!Array.isArray(values)) {
      throw new Error(`Values must be an array for IN operator `);
    }
    return this.addCondition(field, "IN", values, "AND");
  }

  whereNotIn(field, values) {
    if (!Array.isArray(values)) {
      throw new Error(`Values must be an array for NOT IN operator `);
    }
    return this.addCondition(field, "NOT IN", values, "AND");
  }

  whereBetween(field, values) {
    if (!Array.isArray(values)) {
      throw new Error(`Values must be an array for BETWEEN operator `);
    }
    return this.addCondition(field, "BETWEEN", values, "AND");
  }

  whereNull(field) {
    return this.addCondition(field, "IS NULL", null, "AND");
  }

  whereNotNull(field) {
    return this.addCondition(field, "IS NOT NULL", null, "AND");
  }

  whereLike(field, value) {
    return this.addCondition(field, "LIKE", value, "AND");
  }

  whereNotLike(field, value) {
    return this.addCondition(field, "NOT LIKE", value, "AND");
  }

  whereRaw(cond) {
    this.conditions.push({
      type: "raw",
      value: cond,
      logic: "AND",
    });
    return this;
  }

  whereBetweenRaw(field, start, end) {
    this.conditions.push({
      field,
      type: "between",
      value: [start, end],
      logic: "AND",
    });
    return this;
  }

  addGroup(fields) {
    if (Array.isArray(fields)) {
      this.groupBy = [...this.groupBy, ...fields];
    } else {
      this.groupBy = [fields];
    }
    return this;
  }

  addHaving(field, operator, value) {
    this.having.push({
      field,
      operator,
      value,
      type: this.getConditionType(operator, value),
    });

    return this;
  }

  addOrder(field, direct = "ASC") {
    const validDirect = ["ASC", "DESC"];
    const normalizedDirect = direct.toUpperCase();

    if (!validDirect.includes(normalizedDirect)) {
      throw new Error(`Invalid direction: ${normalizedDirect}`);
    }
    this.orderBy.push({
      field: Array.isArray(field) ? field : [field],
      direct: normalizedDirect,
    });
    return this;
  }

  addLimit(limit = null) {
    if (limit !== null) {
      if (typeof limit !== "number" || limit < 0) {
        throw new Error("Limit must be a non-negative integer");
      }
      this.limit = limit;
    }
    return this;
  }
  addOffset(offset = null) {
    if (offset !== null) {
      if (typeof offset !== "number" || offset < 0) {
        throw new Error("Offset must be a non-negative integer");
      }
      this.offset = offset;
    }

    return this;
  }

  addCondition(field, operator, value, logic = "AND") {
    const validOperators = [
      "=",
      "!=",
      ">",
      "<",
      ">=",
      "<=",
      "IN",
      "NOT IN",
      "BETWEEN",
      "IS NULL",
      "IS NOT NULL",
      "LIKE",
      "NOT LIKE",
    ];

    operator = operator.toUpperCase();
    if (!validOperators.includes(operator)) {
      throw new Error(`Invalid operator: ${operator}`);
    }

    this.conditions.push({
      field,
      operator,
      value,
      logic,
      type: this.getConditionType(operator, value),
    });

    return this;
  }

  getConditionType(operator, value) {
    if (operator === "IN" || operator === "NOT IN") {
      return "array";
    } else if (operator === "BETWEEN") {
      return "BETWEEN";
    } else if (operator === "LIKE" || operator === "NOT LIKE") {
      return "LIKE";
    } else if (operator === "IS NULL" || operator === "IS NOT NULL") {
      return "NULL";
    } else {
      return typeof value;
    }
  }

  addCase({
    field = null,
    when = [],
    else: ElseValue = null,
    alias,
    searched = false,
  }) {
    if (!Array.isArray(when) || when.length === 0) {
      throw new Error("When must be an array of conditions");
    }

    if (!alias) {
      throw new Error("Alias must be provided");
    }

    const processWhen = when.map((cond) => {
      if (searched) {
        if (!cond.condition || !cond.result) {
          throw new Error("Condition must contain both condition and result");
        }
        return {
          condition: cond.condition,
          result: cond.result,
          params: this.params || [],
        };
      } else {
        if (!cond.value || !cond.result) {
          throw new Error("Condition must contain both value and result");
        }
        return {
          value: cond.value,
          result: cond.result,
          params: this.params || [],
        };
      }
    });

    this.caseStatements.push({
      field,
      when: processWhen,
      else: ElseValue,
      alias,
      searched,
      type: "case",
    });

    processWhen.forEach((pw) => {
      if (pw.params && pw.params.length > 0) {
        this.params = [...pw.params];
      }
    });
    return this;
  }

  addIf(conditions, thenValue, elseValue, alias) {
    if (!alias) throw new Error("alias is required");

    const ifStmt = `IF(${conditions}, ${thenValue}, ${elseValue}) AS ${alias}`;
    this.fields.push(ifStmt);
    return this;
  }

  addCoalesce(fields, alias) {
    if (!Array.isArray(fields) || fields.length < 2) {
      throw new Error("Fields must be an array of at least 2 elements");
    }
    if (!alias) throw new Error("alias is required");
    const coalesceStr = `COALESCE(${fields.join(", ")}) AS ${alias}`;
    this.fields.push(coalesceStr);
    return this;
  }

  _buildCaseStatements(caseStmt) {
    let caseStr = `CASE `;
    if (!caseStmt.searched && caseStmt.field) {
      caseStr += `${caseStmt.field} `;
      caseStr += `${caseStmt.when
        .map((w) => {
          if (typeof w.value === "string") {
            this.params.push(w.value);
            return `WHEN ? THEN ${w.result}`;
          }
          return `WHEN ${w.value} THEN ${w.result}`;
        })
        .join(" ")}`;
    } else {
      caseStr += caseStmt.when
        .map((w) => `WHEN ${w.condition} THEN ${w.result}`)
        .join(" ");
    }

    if (caseStmt.else !== null) {
      if (typeof caseStmt.else === "string") {
        this.params.push(caseStmt.else);
        caseStr += ` ELSE ?`;
      } else {
        caseStr += ` ELSE ${caseStmt.else}`;
      }
    }

    caseStr += ` END AS ${caseStmt.alias}`;
    console.log(caseStr);

    return caseStr;
  }
  build() {
    let result;
    switch (this.queryType) {
      case "query":
        result = this.buildQuery();
        break;
      case "procedure":
        result = this.buildProcedureCall();
        break;
      case "function":
        result = this.buildFunctionCall();
        break;
      default:
        throw new Error(`Invalid query type: ${this.queryType}`);
    }
    const finalResult = { ...result };
    this.init();
    return finalResult;
  }

  buildQuery() {
    let parts = {
      with: "",
      query: "",
      from: "",
      join: "",
      where: "",
      groupBy: "",
      having: "",
      orderBy: "",
      limit: "",
      offset: "",
      union: "",
      unionAll: "",
    };

    // build with queries (Optional)
    if (this.withClauses.length > 0) {
      const withQueries = this.withClauses.map((clause) => {
        const subQuery = clause.query.build();
        this.params.push(...subQuery.params);
        return `${clause.name} as (${subQuery.query})`;
      });
      parts.with = `WITH ${withQueries.join(", ")}`;
    }

    // build case when
    if (this.caseStatements.length > 0) {
      this.caseStatements.forEach((cs) => {
        this.fields.push(this._buildCaseStatements(cs));
        console.log(cs);
      });
    }

    // build select 1query
    if (this.count) {
      parts.query = `SELECT COUNT(*) AS total`;
    } else {
      const fields = this.fields.length > 0 ? this.fields.join(", ") : "*";
      parts.query = `SELECT ${this.distinct ? "DISTINCT " : ""}${fields} `;
    }

    //build from query
    if (this.tables.length === 0) {
      throw new Error("No tables specified in the query");
    }
    parts.from = `FROM ${this.tables
      .map((tb) => `${tb.name}${tb.alias ? ` AS ${tb.alias}` : ""} `)
      .join(", ")}`;

    // build if statements
    // if (this.ifStatements.length > 0) {
    //   this.ifStatements.forEach((ifStmt) => {
    //     this.fields.push(this._buildIfStatements(ifStmt));
    //   });
    //   this.fields = [...new Set(this.fields)]; // remove duplicates
    //   parts.query = `${parts.query} ${this.fields.join(", ")}`;
    // }

    // build union queries (Optional)

    // build join queries (Optional)
    if (this.joins.length > 0) {
      parts.join = `${this.joins
        .map(
          (j) =>
            `${j.type} JOIN ${j.table}${j.alias ? ` AS ${j.alias}` : ""} ON ${
              j.conditions
            }`
        )
        .join(" ")}`;
    }

    // build where conditions(Optional)
    if (this.conditions.length > 0) {
      const whereClause = this.conditions
        .map((cond, index) => {
          const prefix = index === 0 ? "" : `${cond.logic}`;

          switch (cond.type) {
            case "array":
              if (cond.value.length === 0) return null;
              this.params.push(...cond.value);
              const placeholders = cond.value.map(() => "?").join(", ");
              return `${prefix}${cond.field}${cond.operator} (${placeholders})`;

            case "BETWEEN":
              this.params.push(cond.value.start, cond.value.end);
              return `${prefix}(${cond.field} BETWEEN ? AND ?)`;
            case "NULL":
              return `${prefix}${cond.field} ${cond.operator}`;

            case "raw":
              return `${prefix}${cond.value}`;

            default:
              this.params.push(cond.value);
              return `${prefix}${cond.field} ${cond.operator} ?`;
          }
        })
        .filter((clause) => clause !== null);
      if (whereClause.length > 0) {
        parts.where = `WHERE ${whereClause.join(" ")}`;
      }
    }

    // build group by clause (Optional)
    if (this.groupBy.length > 0) {
      parts.groupBy = `GROUP BY ${this.groupBy.join(", ")}`;

      // build having clause (Optional)
      if (this.having.length > 0) {
        const havingClause = this.having.map((h, i) => {
          const prefix = i === 0 ? "" : `AND`;

          switch (h.type) {
            case "array":
              this.params.push(...h.value);
              const placeholders = h.value.map(() => "?").join(", ");
              return `${prefix}(${h.field}${h.operator} (${placeholders}))`;

            case "null":
              return `${prefix}${h.field} ${h.operator}`;

            default:
              this.params.push(h.value);
              return `${prefix}(${h.field} ${h.operator} ?)`;
          }
        });
        parts.having = `HAVING ${havingClause.join(" ")}`;
      }
    }

    // build order by clause (Optional)
    if (this.orderBy.length > 0) {
      parts.orderBy = `ORDER BY ${this.orderBy
        .map((o) => `${o.field} ${o.direct}`)
        .join(", ")}`;
    }

    // build limit and offset clauses (Optional)
    if (this.limit !== null) {
      parts.limit = `LIMIT ?`;
      this.params.push(this.limit);
    }
    if (this.offset !== null) {
      parts.offset = `OFFSET ?`;
      this.params.push(this.offset);
    }

    //combine parts
    const query = [
      parts.with,
      parts.query,
      parts.from,
      parts.join,
      parts.where,
      parts.groupBy,
      parts.having,
      parts.orderBy,
      parts.limit,
      parts.offset,
      parts.union,
      parts.unionAll,
    ]
      .filter((part) => part)
      .join(" ");

    console.log(parts);
    console.log(this.params);

    return {
      query,
      params: this.params,
      parts,
      debug: {
        conditions: this.conditions,
        parameterCount: this.params.length,
      },
    };
  }
  _buildIfStatements(query, params) {
    const field = query.field;
    const value = query.value;
    const operator = query.operator;
    const result = query.result;

    let condition;
    if (typeof value === "string") {
      condition = `${field} ${operator}?`;
      this.params.push(value);
    } else {
      condition = `${field} ${operator} ${value}`;
    }

    return `CASE WHEN ${condition} THEN ${result} END`;
  }

  isCount() {
    this.count = true;
    return this;
  }

  idDistinct() {
    this.distinct = true;
    return this;
  }
  buildProcedureCall() {
    if (!this.procedures) {
      throw new Error("Procedures must be provided");
    }

    const query = `CALL ${this.procedures} (${this.procedureParams
      .map(() => "?")
      .join(", ")})`;
    return {
      query,
      params: this.procedureParams,
    };
  }

  buildFunctionCall() {
    if (!this.functions) {
      throw new Error("Functions must be provided");
    }
    const placeholders = this.functionParams.map(() => "?").join(", ");
    const query = `select ${this.functions}(${placeholders}) AS result`;
    return {
      query,
      params: this.functionParams,
    };
  }
}

export default MySQLQueryBuilder;
