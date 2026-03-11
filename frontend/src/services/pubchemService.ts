import axios from 'axios';

const pubchemApi = axios.create({
  baseURL: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug',
  timeout: 10000,
});

export interface PubChemSearchResult {
  cid: number;
  name: string;
  formula?: string;
  molecularWeight?: number;
  iupacName?: string;
}

export interface PubChemData {
  formula: string;
  molecularWeight: number;
  iupacName: string;
  inchi: string;
  inchiKey: string;
  canonicalSmiles: string;
  ghsPictograms?: string[];
  hazardStatements?: string[];
  safetyStatements?: string[];
}

export const pubchemService = {
  // Buscar por nombre con mejor manejo de errores
  async searchByName(query: string): Promise<PubChemSearchResult[]> {
    try {
      if (query.length < 3) return [];

      console.log(`Buscando en PubChem: "${query}"`);

      const nameResponse = await pubchemApi.get(
        `/compound/name/${encodeURIComponent(query)}/cids/JSON`
      ).catch(error => {
        if (error.response?.status === 404) {
          console.log(`"${query}" no encontrado exactamente, probando búsqueda por similitud...`);
          return this.autocompleteSearch(query);
        }
        throw error;
      });

      if (Array.isArray(nameResponse)) {
        return nameResponse;
      }

      const cids = nameResponse.data?.IdentifierList?.CID;

      if (!cids || cids.length === 0) {
        return [];
      }

      const topCids = cids.slice(0, 5);

      const detailsResponse = await pubchemApi.get(
        `/compound/cid/${topCids.join(',')}/property/IUPACName,MolecularFormula,MolecularWeight/JSON`
      );

      const properties = detailsResponse.data?.PropertyTable?.Properties || [];

      return properties.map((prop: any) => ({
        cid: prop.CID,
        name: prop.IUPACName || `Compound CID ${prop.CID}`,
        formula: prop.MolecularFormula || '',
        molecularWeight: prop.MolecularWeight ? parseFloat(prop.MolecularWeight) : undefined,
        iupacName: prop.IUPACName
      }));

    } catch (error) {
      console.error('Error searching PubChem by name:', error);
      return [];
    }
  },

  // Búsqueda por autocompletado
  async autocompleteSearch(query: string): Promise<PubChemSearchResult[]> {
    try {
      const response = await axios.get(
        `https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(query)}/json`
      );

      const suggestions = response.data?.dictionary_terms?.compound || [];

      if (suggestions.length === 0) return [];

      const topSuggestions = suggestions.slice(0, 3);
      const results: PubChemSearchResult[] = [];

      for (const suggestion of topSuggestions) {
        try {
          const searchResult = await this.searchByName(suggestion);
          if (searchResult.length > 0) {
            results.push(searchResult[0]);
          }
        } catch (e) {
          console.log(`No se pudo obtener detalles para "${suggestion}"`);
        }
      }

      return results;
    } catch (error) {
      console.error('Error in autocomplete search:', error);
      return [];
    }
  },

  // Buscar por CAS
  async searchByCAS(casNumber: string): Promise<PubChemSearchResult[]> {
    try {
      const response = await pubchemApi.get(
        `/compound/name/${encodeURIComponent(casNumber)}/cids/JSON`
      );

      const cids = response.data?.IdentifierList?.CID;

      if (!cids || cids.length === 0) {
        return [];
      }

      const detailsResponse = await pubchemApi.get(
        `/compound/cid/${cids[0]}/property/IUPACName,MolecularFormula,MolecularWeight/JSON`
      );

      const prop = detailsResponse.data?.PropertyTable?.Properties?.[0];

      return [{
        cid: prop.CID,
        name: prop.IUPACName || `Compound CID ${prop.CID}`,
        formula: prop.MolecularFormula,
        molecularWeight: prop.MolecularWeight ? parseFloat(prop.MolecularWeight) : undefined,
        iupacName: prop.IUPACName
      }];

    } catch (error) {
      console.error('Error searching PubChem by CAS:', error);
      return [];
    }
  },

  // Obtener detalles completos por CID
  async getCompoundDetails(cid: number): Promise<PubChemData | null> {
    try {
      const propsResponse = await pubchemApi.get(
        `/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,InChI,InChIKey,CanonicalSMILES/JSON`
      );

      const properties = propsResponse.data?.PropertyTable?.Properties?.[0];

      return {
        formula: properties?.MolecularFormula || '',
        molecularWeight: properties?.MolecularWeight || 0,
        iupacName: properties?.IUPACName || '',
        inchi: properties?.InChI || '',
        inchiKey: properties?.InChIKey || '',
        canonicalSmiles: properties?.CanonicalSMILES || '',
      };
    } catch (error) {
      console.error('Error getting compound details:', error);
      return null;
    }
  },

  // Obtener pictogramas GHS (simulados)
  async getGHSPictograms(casNumber: string): Promise<string[]> {
    const lastDigit = parseInt(casNumber.slice(-1)) || 0;

    if (lastDigit < 3) return ['GHS07'];
    if (lastDigit < 6) return ['GHS06', 'GHS05'];
    return ['GHS06', 'GHS08', 'GHS05'];
  },

  // Buscar y formatear para autocompletado
  async searchForRequestItem(query: string): Promise<any[]> {
    try {
      const results = await this.searchByName(query);

      if (results.length === 0) {
        return [{
          value: 0,
          label: `No se encontró "${query}". Intenta con un nombre más específico.`,
          disabled: true  // Solo este mensaje debe estar disabled
        }];
      }

      return results.map(r => ({
        value: r.cid,
        label: `${r.name} (${r.formula || 'Fórmula desconocida'})`,
        formula: r.formula,
        cid: r.cid,
        name: r.name,
        molecularWeight: r.molecularWeight,
        disabled: false  // Asegurar que no esté disabled
      }));
    } catch (error) {
      console.error('Error searching for request item:', error);
      return [];
    }
  }
};
