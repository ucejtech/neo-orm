let privateMethods = new WeakMap();

class GraphQueryBuilder {
  constructor() {
    this.query = "";
    this.labelVariables = new Set();
    this.relationsVariables = new Set();
    privateMethods.set(this, {
      generateClause: (obj) =>
        Object.keys(obj).reduce(
          (a, b, i, main) =>
            `${a}${b}:'${obj[b]}'${i === main.length - 1 ? "}" : ", "}`,
          " {"
        ),
    });
  }
  /**
   * Create a match query
   * @param queryObject The queryObject containing label and data if needed
   * @param {string} queryObject.label The label for generated query.
   * @param {string} queryObject.data The custom attributes for selected label.
   */
  match({ label, data }) {
    const variable = `${"label".toLowerCase()}${this.labelVariables.size + 1}`;
    const dataR =
      data && Object.keys(data).length > 0
        ? privateMethods.get(this).generateClause(data)
        : "";
    this.query = `${this.query ? `${this.query}, ` : ""}MATCH (${variable}${
      label ? `:${label}` : ""
    }${dataR})`;
    this.labelVariables.add(variable);
    return this;
  }

  link({ relations, relationLabel }) {
    if (relations && !/^:\w+((\|:?\w+)+?)?$/.test(relations))
      throw new Error("Invalid Parameter");
    const labelVariable = `${"label".toLowerCase()}${
      this.labelVariables.size + 1
    }`;
    const relationVariable = `${"relation".toLowerCase()}${
      this.relationsVariables.size + 1
    }`;
    this.query = `${this.query}-[${relationVariable}${
      relations ? `${relations.toUpperCase()}` : ""
    }]-(${labelVariable}${relationLabel ? `:${relationLabel}` : ""})`;
    this.relationsVariables.add(relationVariable);
    this.labelVariables.add(labelVariable);
    return this;
  }

  linkForward({ relations, relationLabel }) {
    if (relations && !/^:\w+((\|:?\w+)+?)?$/.test(relations))
      throw new Error("Invalid Parameter");
    const labelVariable = `${"label".toLowerCase()}${
      this.labelVariables.size + 1
    }`;
    const relationVariable = `${"relation".toLowerCase()}${
      this.relationsVariables.size + 1
    }`;
    this.query = `${this.query}-[${relationVariable}${
      relations ? `${relations.toUpperCase()}` : ""
    }]->(${labelVariable}${relationLabel ? `:${relationLabel}` : ""})`;
    this.relationsVariables.add(relationVariable);
    this.labelVariables.add(labelVariable);
    return this;
  }

  linkBackward({ relations, relationLabel }) {
    if (relations && !/^:\w+((\|:?\w+)+?)?$/.test(relations))
      throw new Error("Invalid Parameter");
    const labelVariable = `${"label".toLowerCase()}${
      this.labelVariables.size + 1
    }`;
    const relationVariable = `${"relation".toLowerCase()}${
      this.relationsVariables.size + 1
    }`;
    this.query = `${this.query}<-[${relationVariable}${
      relations ? `${relations.toUpperCase()}` : ""
    }]-(${labelVariable}${relationLabel ? `:${relationLabel}` : ""})`;
    this.relationsVariables.add(relationVariable);
    this.labelVariables.add(labelVariable);
    return this;
  }

  /**
   * Construct query and return
   * @param queryObject The queryObject containing label and data if needed
   * @param {string} queryObject.limit The amount limit for generated query data.
   * @returns {string} Generated query.
   */
  build({ limit }) {
    const relationsVariables = [...this.relationsVariables];
    const labelVariables = [...this.labelVariables];
    const variables = relationsVariables.concat(labelVariables);
    this.query = `${this.query}${variables.reduce((a, b, i) => {
      return `${a}${i > 0 ? "," : ""} ${b}${
        i === variables.length - 1 && limit ? ` LIMIT ${limit}` : ""
      }`;
    }, " RETURN")}`;
    return this.return();
  }

  return() {
    return this.query;
  }
}

module.exports = GraphQueryBuilder;

// TODO: use destructuring in converting sets to arrays

// console.time("Build");
// const gQ = new GraphQueryBuilder();
// let query = gQ
//   .match({ label: "Person" })
//   .link({ relations: ":ACTED_IN|DIRECTED|PRODUCED", relationLabel: "Movie" })
//   .build({});
// console.log(query);
// console.timeEnd("Build");

// // MATCH (tom {name:"Tom Hanks"})-[:ACTED_IN]->(m)<-[:ACTED_IN]-(coActors) RETURN coActors.name
// // MATCH (p {name: 'Tom Hanks'})-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(p1) RETURN m,p1.name
