class QueryBuilder {
  constructor(tableName) {
    if (!tableName) {
      throw new Error("Table name must be provided.");
    }

    this.tableName = tableName;
    this.joins = [];
    this.joinValues = [];
    this.ctes = [];
    this.cteValues = [];
    this.sources = [];
    this.sourcesValues = [];
    this.queryType = "";
  }

  addSource(sourceName, sourceType, definition) {
    this.sources.push({
      name: sourceName,
      type: sourceType.toUpperCase(),
      definition,
    });
    return this;
  }

  buildSource(sourceType, params) {
    switch (sourceType.toUpperCase()) {
      case "CTE":
        return this.buildCTESource(params);
      case "TABLE":
        return this.buildTableSource(params);
      case "JOIN":
        return this.buildJoinSource(params);
      case "PROCEDURE":
        return this.buildProcedureSource(params);
      default:
        throw new Error(`Unsupported source type : ${sourceType}`);
    }
  }
  buildCTESource(params) {
    const ctes = [];
    const values = [];
    params.ctes.forEach((cte) => {
      const { name, query, params: cteParams = [] } = cte;
      ctes.push(`${name} AS (${cte.query})`);
      values.push(...values, ...cteParams);
    });
    return {
      query: `WITH ${ctes.join(", \n")}`,
      values,
    };
  }

  buildJoinSource(params) {
    const joins = [];
    const values = [];
    params.joins.forEach((join) => {
      const { type, tableName, alias, conditions, subQuery } = join;
      let joinTable = tableName;
      if (subQuery) {
        joinTable = `(${subQuery.query}) AS $${alias}`;
        values.push(...subQuery.values);
      } else if (alias) {
        joinTable = `${tableName} AS ${alias}`;
      }

      const joinConditions = this.buildJoinConditions(conditions);
      values.push(...joinConditions.values);

      joins.push(
        `${type.toUpperCase()} JOIN ${joinTable} ON ${joinConditions.clauses}`
      );
    });
    return {
      query: `${joins.join("\n")}`,
      values,
    };
  }

  buildProcedureSource(params) {
    const { name, parameters = [], alias } = params;
    const placeholders = parameters.map(() => "?").join(", ");
    return {
      query: `(CALL ${name}(${placeholders})) AS ${alias || name}`,
      values: parameters,
    };
  }

  buildTableSource(params) {
    const { name, alias } = params;
    return {
      query: `${name} AS ${alias || name}`,
    };
  }

  buildComplexQuery(params) {
    const {
      sources = [],
      fields,
      conditions = ["*"],
      sort = null,
      page = null,
      limit = null,
    } = params;

    let query = "";
    let allValues = [];

    if (sources.length > 0) {
      const sourceQueries = [];
      sources.forEach((source) => {
        const { query: sourceQuery, values } = this.buildSource(
          source.sourceType,
          source.params
        );
        sourceQueries.push(sourceQuery);
        allValues.push(...values);
      });
      query += sourceQueries.join("\n");
    }

    const { where, values: whereValues } = this.buildWhereClause(conditions);
    const orderBy = this.buildOrderByClause(sort);
    const pagination = this.buildPagination(page, limit);

    query += `SELECT ${Array.isArray(fields) ? fields.join(", ") : "*"}
    FROM ${this.tableName}
    ${this.joins.join("\n")}
    ${where},
    ${orderBy}
    ${pagination}`.trim();

    queryNoWhereClause += `SELECT ${
      Array.isArray(fields) ? fields.join(", ") : "*"
    }
      FROM ${this.tableName}
      ${this.joins.join("\n")}
      ${orderBy}
      ${pagination}`.trim();

    queryNoPaginationClause += `SELECT ${
      Array.isArray(fields) ? fields.join(", ") : "*"
    }
      FROM ${this.tableName}
      ${this.joins.join("\n")}
      ${where}
      ${orderBy}`.trim();
    queryNoSortAndPaginationClause += `SELECT ${
      Array.isArray(fields) ? fields.join(", ") : "*"
    }
    FROM ${this.tableName}
    ${this.joins.join("\n")}
    ${where}`.trim();

    return {
      query: query,
      queryNoWhereClause: queryNoWhereClause,
      queryNoPaginationClause: queryNoPaginationClause,
      queryNoSortAndPaginationClause: queryNoSortAndPaginationClause,
      values: [...allValues, ...this.joinValues, ...whereValues],
    };
  }

  setQueryType(type) {
    const validTypes = ["normal", "procedure", "view", "function"]
      .toString()
      .toUpperCase();
    if (!validTypes.includes(type.toUpperCase())) {
      throw new Error(
        `Invalid query type. Must be one of: ${validTypes.join(", ")}`
      );
    }
    this.queryType = type.toUpperCase();
    return this;
  }

  // Build query master
  buildQuery(method, params = {}) {
    const builders = {
      NORMAL: this.buildNormalQuery(method, params),
      PROCEDURE: this.buildProcedure(method, params),
      VIEW: this.buildView(method, params),
      FUNCTION: this.buildFunction(method, params),
    };

    const builder = builders[this.queryType];
    if (!builder) {
      throw new Error(`Unsupported query type : ${this.queryType}`);
    }

    return builder();
  }

  // Queries build base on query types
  buildNormalQuery(method, params) {
    const methods = {
      select: () =>
        this.buildSelect(
          params.fields,
          params.conditions,
          params.sort,
          params.page,
          params.limit
        ),
      selectNoPagination: () =>
        this.buildSelectNoPagination(params.fields, params.conditions),
      selectWhereClause: () => this.buildSelectWhereClause(params.conditions),
      selectNoWhereClause: () => this.buildNoWhereClause(params.fields),
      insert: () => this.buildInsert(params.data),
      update: () => this.buildUpdate(params.data, params.condition),
      delete: () => this.buildDelete(params.condition),
      count: () => this.buildCount(),
      countNoWhereClause: this.buildCountNoWhereClause(),
    };

    const builder = methods[method.toUpperCase()];
    if (!builder) {
      throw new Error(`Unsupported method query : ${method}`);
    }

    return builder();
  }

  // Procedures build base on query types
  buildProcedure(method, params) {
    const [procedureName, inputParams, outputParams, options] = params;

    switch (method.toUpperCase()) {
      case "call".toUpperCase():
        if (outputParams) {
          return this.buildProcedureWithOutput(
            procedureName,
            inputParams,
            outputParams
          );
        }
        return this.buildProcedureCall(procedureName, inputParams);
      case "select".toUpperCase():
        return this.buildProcedureSelect(
          procedureName,
          inputParams,
          options?.fields,
          options?.conditions,
          options?.sort,
          options?.page,
          options?.limit
        );
      case "call with join".toUpperCase():
        return this.buildProcedureCallWithJoin(
          procedureName,
          inputParams,
          options?.join
        );
      case "call with jon no pagination".toUpperCase():
        return this.buildProcedureCallWithJoinNoPagination(
          procedureName,
          inputParams,
          options?.join
        );
      case "call without input parameters".toUpperCase():
        return this.buildProcedureCallWithoutInputParameters(procedureName);
      case "call with join where clause".toUpperCase():
        return this.buildProcedureCallWithJoinWhereClause(
          procedureName,
          inputParams,
          options?.join
        );
      case "call without join where clause".toUpperCase():
        return this.buildProcedureCallWithoutJoinWhereClause(
          procedureName,
          inputParams
        );

      default:
        throw new Error(`Unsupported method  for procedure: ${method}`);
    }
  }

  buildProcedureWithOutput(procedureName, inputParams, outputParams) {
    return {
      query: `CALL ${procedureName}(${inputParams
        .map((param) => param.name)
        .join(", ")})`,
      values: inputParams.map((param) => param.value),
      outputParams,
    };
  }

  buildProcedureCall(procedureName, inputParams) {
    return {
      query: `CALL ${procedureName}(${inputParams
        .map((param) => param.name)
        .join(", ")})`,
      values: inputParams.map((param) => param.value),
    };
  }
  buildProcedureSelect(
    procedureName,
    inputParams,
    fields,
    conditions,
    sort,
    page,
    limit
  ) {
    return {
      query: `CALL ${procedureName}(${inputParams
        .map((param) => param.name)
        .join(", ")})`,
      values: inputParams.map((param) => param.value),
      fields,
      conditions,
      sort,
      page,
      limit,
    };
  }

  buildProcedureCallWithJoin(procedureName, inputParams, join) {
    return {
      query: `CALL ${procedureName}(${inputParams
        .map((param) => param.name)
        .join(", ")})`,
      values: inputParams.map((param) => param.value),
      join,
    };
  }

  buildProcedureCallWithJoinNoPagination(procedureName, inputParams, join) {
    return {
      query: `CALL ${procedureName}(${inputParams
        .map((param) => param.name)
        .join(", ")})`,
      values: inputParams.map((param) => param.value),
      join,
    };
  }

  buildProcedureCallWithoutInputParameters(procedureName) {
    return {
      query: `CALL ${procedureName}()`,
      values: [],
    };
  }

  buildProcedureCallWithJoinWhereClause(procedureName, inputParams, join) {
    return {
      query: `CALL ${procedureName}(${inputParams
        .map((param) => param.name)
        .join(", ")})`,
      values: inputParams.map((param) => param.value),
      join,
      conditions: join.where,
    };
  }

  buildProcedureCallWithoutJoinWhereClause(procedureName, inputParams) {
    return {
      query: `CALL ${procedureName}(${inputParams
        .map((param) => param.name)
        .join(", ")})`,
      values: inputParams.map((param) => param.value),
    };
  }

  // Views build base on query types
  buildView(method, params) {
    const { viewName, conditions, fields, sort, page, limit } = params;
    switch (method.toUpperCase()) {
      case "select".toUpperCase():
        return {
          query: `select ${fields ? fields.join(", ") : "*"}
        from ${viewName}
        ${this.buildWhereClause(conditions).where}
        ${this.buildOrderByClause(sort)}
        ${this.buildPagination(page, limit)}`.trim(),
          values: this.buildWhereClause(conditions).values,
        };

      case "create".toUpperCase():
        return {
          query: `CREATE VIEW OR REPLACE ${viewName} AS
          SELECT ${params.viewDefinition.fields.join(", ")}
          FROM ${params.viewDefinition.baseTable}
          ${params.viewDefinition.joins || ""}
          ${params.viewDefinition.where || ""}`.trim(),
          values: [],
        };

      default:
        throw new Error(`Unsupported method for view: ${method}`);
    }
  }

  // Functions build base on query types
  buildFunction(method, params) {
    const { functionName, args, options } = params;

    switch (method.toUpperCase()) {
      case "call".toUpperCase():
        const argPlaceholders = args.map(() => "?").join(", ");
        return {
          query: `select ${functionName}(${argPlaceholders}) AS result`,
          values: args,
        };

      case "select".toUpperCase():
        const { conditions, fields = ["*"], sort, page, limit } = options;
        const functionCall = `${functionName}(${args
          .map((arg) => "?")
          .join(", ")})`;

        return {
          query: ` select ${fields.join(", ")}
        from ${functionCall} as func_result
        ${this.buildWhereClause(conditions).where}
        ${this.buildOrderByClause(sort)}
        ${this.buildPagination(page, limit)}`.trim(),
          values: [...args, ...this.buildWhereClause(conditions).values],
        };

      case "create".toUpperCase():
        return {
          query: `CREATE OR REPLACE FUNCTION ${functionName}(${args
            .map((arg) => `${arg} ${typeof arg === "string" ? "TEXT" : "INT"}`)
            .join(", ")}) RETURNS ${options.returnType} AS $$
        ${options.functionBody}
        $$ LANGUAGE plpgsql`,
          values: [],
        };

      case "drop".toUpperCase():
        return {
          query: `DROP FUNCTION ${functionName}(${args
            .map((arg) => `${arg} ${typeof arg === "string" ? "TEXT" : "INT"}`)
            .join(", ")})`,
          values: [],
        };

      case "update".toUpperCase():
        return {
          query: `UPDATE ${functionName}(${args
            .map((arg) => `${arg} ${typeof arg === "string" ? "TEXT" : "INT"}`)
            .join(", ")})`,
          values: [],
        };

      case "delete".toUpperCase():
        return {
          query: `DELETE FROM ${functionName}(${args
            .map((arg) => `${arg} ${typeof arg === "string" ? "TEXT" : "INT"}`)
            .join(", ")})`,
          values: [],
        };

      case "insert".toUpperCase():
        return {
          query: `INSERT INTO ${functionName}(${args
            .map((arg) => `${arg} ${typeof arg === "string" ? "TEXT" : "INT"}`)
            .join(", ")})`,
          values: [],
        };

      default:
        throw new Error(`Unsupported method for function: ${method}`);
    }
  }

  addJoin(type, tableName, conditions) {
    const joinTypes = {
      INNER: "INNER JOIN",
      LEFT: "LEFT JOIN",
      RIGHT: "RIGHT JOIN",
      FULL: "FULL JOIN",
    };

    const joinType = joinTypes[type.toUpperCase()] || "INNER JOIN";

    let joinClause = "";
    const values = [];

    if (typeof conditions === "string") {
      joinClause = `${joinType} ${tableName} ON ${conditions}`;
    } else if (Array.isArray(conditions)) {
      const joinConditions = conditions.map((cond) => {
        if (Array.isArray(cond)) {
          const [leftField, operator, rightField, value] = cond;
          if (value !== undefined) {
            values.push(value);
            return `${leftField} ${rightField} ?`;
          }
          return `${leftField} ${operator} ${rightField}`;
        }
        return cond;
      });
      joinClause = `${joinType} ${tableName} ON ${joinConditions.join(
        " AND "
      )}`;
    } else if (typeof conditions === "object") {
      const { clause, params } = this.buildJoinConditions(conditions);
      joinClause = `${joinType} ${tableName} ON ${clause}`;
      values.push(...params);
    }

    this.joins.push(joinClause);
    this.joinValues.push(...values);
    return this;
  }

  buildJoinConditions(conditions) {
    const clauses = [];
    const params = [];

    if (conditions.AND || conditions.OR) {
      const operator = conditions.AND ? "AND" : "OR";
      const subCondition = conditions.AND || conditions.OR;

      subCondition.forEach((cond) => {
        const [leftField, op, rightField, value] = cond;
        if (value !== undefined) {
          clauses.push(`${leftField} ${op} ?`);
          params.push(value);
        } else {
          clauses.push(`${leftField} ${op} ${rightField}`);
        }
      });

      return {
        clause: `(${clauses.join(` ${operator} `)})`,
        params,
      };
    }
    return {
      clauses: "",
      params: [],
    };
  }

  buildFieldExpression(field) {
    if (typeof field === "string") {
      return field;
    }

    if (!field.type) {
      throw new Error("Field type must be provided.");
    }
    switch (field.type.toUpperCase()) {
      case "if".toUpperCase():
        return this.buildIfExpression(field);
      case "case".toUpperCase():
        return this.buildCaseExpression(field);
      case "cast".toUpperCase():
        return this.buildCastExpression(field);
      case "max".toUpperCase():
        return this.buildMaxExpression(field);
      case "min".toUpperCase():
        return this.buildMinExpression(field);
      case "sum".toUpperCase():
        return this.buildSumExpression(field);
      case "concat".toUpperCase():
        return this.buildConcatExpression(field);
      case "substring".toUpperCase():
        return this.buildSubstringExpression(field);
      case "left".toUpperCase():
        return this.buildLeftExpression(field);
      case "right".toUpperCase():
        return this.buildRightExpression(field);
      case "length".toUpperCase():
        return this.buildLengthExpression(field);
      case "count".toUpperCase():
        return this.buildCountExpression(field);
      case "datediff".toUpperCase():
        return this.buildDateDiffExpression(field);
      case "date_format".toUpperCase():
        return this.buildDateFormatExpression(field);
      case "coalesce".toUpperCase():
        return this.buildCoalesceExpression(field);
      case "concat_ws".toUpperCase():
        return this.buildConcatWsExpression(field);
      case "replace".toUpperCase():
        return this.buildReplaceExpression(field);
      case "convert".toUpperCase():
        return this.buildConvertExpression(field);
      case "contains".toUpperCase():
        return this.buildContainsExpression(field);
      case "str_to_date".toUpperCase():
        return this.buildStrToDateExpression(field);

      // case ''.toUpperCase():
      // case ''.toUpperCase():
      // case ''.toUpperCase():
      // case ''.toUpperCase():

      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }
  }

  //build expression
  buildIfExpression(field) {
    const { condition, trueValue, falseValue, alias } = field;
    let expr = `IF (${condition}, ${this.formatValue(
      trueValue
    )}, ${this.formatValue(falseValue)})`;

    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildCaseExpression(field) {
    const { cases, elseValue, alias } = field;
    let expre = "CASE";
    cases.forEach((caseItem) => {
      expre += ` WHEN ${caseItem.when} THEN ${this.formatValue(caseItem.then)}`;
    });

    if (elseValue !== undefined) {
      expre += ` ELSE ${this.formatValue(elseValue)}`;
    }
    expre += ` END`;
    return alias ? `${expre} AS ${alias}` : expre;
  }

  buildCastExpression(field) {
    const { expression, type, alias } = field;
    let expr = `CAST(${expression} AS ${type})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildMaxExpression(field) {
    const { expression, alias } = field;
    let expr = `MAX(${expression})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildMinExpression(field) {
    const { expression, alias } = field;
    let expr = `MIN(${expression})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildSumExpression(field) {
    const { expression, alias, condition } = field;
    let expr = condition
      ? `sum(case when ${condition} then ${expression} else 0 end)`
      : `SUM(${expression})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildConcatExpression(field) {
    const { expressions, separator = "", alias } = field;
    let expr = `CONCAT(${expressions
      .map((v) => this.formatValue(v))
      .join(`,${this.formatValue(separator)}`)})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildReplaceExpression(field) {
    const { expression, pattern, replacement, alias } = field;
    let expr = `REPLACE(${expression}, ${this.formatValue(
      pattern
    )}, ${this.formatValue(replacement)})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildConvertExpression(field) {
    const { expression, type, alias } = field;
    let expr = `CONVERT(${expression} USING ${type})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildContainsExpression(field) {
    const { expression, pattern, alias } = field;
    let expr = `CONCAT(${expression}, ${this.formatValue(pattern)})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildStrToDateExpression(field) {
    const { expression, format, alias } = field;
    let expr = `STR_TO_DATE(${expression}, ${this.formatValue(format)})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildCoalesceExpression(field) {
    const { expressions, alias } = field;
    let expr = `COALESCE(${expressions
      .map((v) => this.formatValue(v))
      .join(`,`)})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildCountExpression(field) {
    const { expression, alias } = field;
    let expr = `COUNT(${expression})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildConcatWsExpression(field) {
    const { expressions, separator, alias } = field;
    let expr = `CONCAT_WS(${this.formatValue(separator)}, ${expressions
      .map((v) => this.formatValue(v))
      .join(`,`)})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildDateFormatExpression(field) {
    const { expression, format, alias } = field;
    let expr = `DATE_FORMAT(${expression}, ${this.formatValue(format)})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildConvertExpression(field, value) {
    const { expression, type, alias } = field;
    let expr = `CONVERT(${expression} USING ${type})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildLeftExpression(field) {
    const { expression, length, alias } = field;
    let expr = `LEFT(${expression}, ${length})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildRightExpression(field) {
    const { expression, length, alias } = field;
    let expr = `RIGHT(${expression}, ${length})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildLengthExpression(field) {
    const { expression, alias } = field;
    let expr = `LENGTH(${expression})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildSubstringExpression(field) {
    const { expression, start, length, alias } = field;
    let expr = `SUBSTRING(${expression}, ${start}, ${length})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  buildDateDiffExpression(field) {
    const { expression1, expression2, alias } = field;
    let expr = `DATEDIFF(${expression1}, ${expression2})`;
    return alias ? `${expr} AS ${alias}` : expr;
  }

  formatValue(value) {
    if (value === null || value === undefined) return null;
    if (
      typeof value === "string" &&
      !value.includes("`") &&
      !value.includes("(")
    ) {
      return `'${value}'`;
    }
    return value;
  }

  buildSelect(
    fields = ["*"],
    conditions = {},
    sort = null,
    page = null,
    limit = null
  ) {
    const { where, values } = this.buildWhereClause(conditions);
    const orderBy = this.buildOrderByClause(sort);
    const pagination = this.buildPagination(page, limit);
    const joins = this.joins.join(" ");

    const query = `
    SELECT ${Array.isArray(fields) ? fields.join(", ") : "*"}
    FROM ${this.tableName}
    ${joins}
    ${where}
    ${orderBy}
    ${pagination}
    `.trim();
    return { query, values: [...this.joinValues, ...values] };
  }

  buildSelectNoPagination(fields = ["*"], conditions = {}) {
    const { where, values } = this.buildWhereClause(conditions);
    const query = `
    SELECT ${Array.isArray(fields) ? fields.join(", ") : "*"}
    FROM ${this.tableName}
    ${where}
    `.trim();
    return { query, values };
  }

  buildSelectWhereClause(conditions = {}) {
    const { where, values } = this.buildWhereClause(conditions);
    const query = `
    SELECT *
    FROM ${this.tableName}
    ${where}
    `.trim();
    return { query, values };
  }

  buildNoWhereClause(fields = ["*"]) {
    const { where, values } = `
    SELECT ${Array.isArray(fields) ? fields.join(", ") : "*"}
    FROM ${this.tableName}
    `.trim();

    return { query: where, values };
  }

  buildCount(condition = {}) {
    const { where, values } = this.buildWhereClause(condition);

    const query = `
    SELECT COUNT(*) as count
    FROM ${this.tableName}
    ${where}
    `.trim();

    return { query, values };
  }

  buildCountNoWhereClause() {
    const query = `
    SELECT COUNT(*) as count
    FROM ${this.tableName}
    `.trim();

    console.log(`You're query: ${query}`);

    return { query, values: [] };
  }

  buildInsert(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholder = fields.map(() => "?").join(", ");
    const query = `INSERT INTO ${this.tableName} (${fields.join(
      ", "
    )}) VALUES (${placeholder})`;
    return { query, values };
  }

  buildUpdate(data, condition) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const { where, values: whereValues } = this.buildWhereClause(condition);
    const whereClause = where ? `WHERE ${where}` : "";
    const query = `UPDATE ${this.tableName} SET ${fields
      .map((field, index) => `${field} = ?`)
      .join(", ")} ${whereClause}`;
    return { query, values: [...values, ...whereValues] };
  }

  buildDelete(condition) {
    const { where, values } = this.buildWhereClause(condition);
    const query = `DELETE FROM ${this.tableName} ${where}`;
    return { query, values };
  }

  buildWhereClause(conditions) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return { where: "", values: [] };
    }

    const clauses = [];
    const values = [];

    const buildCondition = (condition) => {
      if (Array.isArray(condition)) {
        const [fields, operator, value] = condition;

        switch (operator.toUpperCase()) {
          case "=":
          case "!=":
          case ">":
          case "<":
          case ">=":
          case "<=":
            clauses.push(`${fields} ${operator} ?`);
            values.push(value);
            break;

          case "IN":
            if (Array.isArray(value)) {
              const placeholder = value.map(() => "?").join(", ");
              clauses.push(`${fields} IN ${placeholder}`);
              values.push(...value);
            }
            break;

          case "NOT IN":
            if (Array.isArray(value)) {
              const placeholder = value.map(() => "?").join(", ");
              clauses.push(`${fields} NOT IN ${placeholder}`);
              values.push(...value);
            }
            break;

          case "LIKE":
          case "NOT LIKE":
            clauses.push(`${fields} ${operator} ?`);
            values.push(`%${value}%`);
            break;
          case "Starts With".toUpperCase():
            clauses.push(`${fields} LIKE ?`);
            values.push(`${value}%`);
            break;
          case "Ends With".toUpperCase():
            clauses.push(`${fields} LIKE?`);
            values.push(`%${value}`);
            break;
          case "Contains".toUpperCase():
            clauses.push(`${fields} LIKE?`);
            values.push(`%${value}%`);
            break;

          case "Between".toUpperCase():
            if (Array.isArray(value) && value.length === 2) {
              clauses.push(`${fields} BETWEEN ? AND ?`);
              values.push(value[0], value[1]);
            }
            break;
          default:
            clauses.push(`${fields} ${operator} ?`);
            values.push(value);
        }
      }
    };
    const processConditions = (conditions) => {
      if (conditions.AND || conditions.OR) {
        const op = conditions.AND ? "AND" : "OR";
        const subClauses = [];
        const subConditions = conditions.AND || conditions.OR;

        subConditions.forEach((cond) => {
          const prevLength = subClauses.length;
          buildCondition(cond);
          if (subClauses.length > prevLength) {
            subClauses.push(clauses.pop());
          }
        });

        if (subClauses.length) {
          clauses.push(`(${subClauses.join(` ${op} `)})`);
        }
      } else {
        buildCondition(conditions);
      }
    };

    if (Array.isArray(conditions)) {
      conditions.forEach((cond) => processConditions(cond));
    } else {
      processConditions(conditions);
    }

    return {
      where: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
      values,
    };
  }

  buildOrderByClause(sort) {
    if (!sort) return "";
    const orders = Array.isArray(sort) ? sort : [sort];
    const orderClauses = orders.map((order) => {
      const [field, direction] = order.split(":");
      return `${field} ${direction?.toUpperCase() || "ASC"}`;
    });
    return `ORDER BY ${orderClauses.join(", ")}`;
  }

  buildPagination(page, limit) {
    if (!page || !limit) return "";
    const offset = (page - 1) * limit;
    return `LIMIT ${limit} OFFSET ${offset}`;
  }
}

export default QueryBuilder;
