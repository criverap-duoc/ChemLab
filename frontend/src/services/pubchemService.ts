import axios from 'axios';

const pubchemApi = axios.create({
  baseURL: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug',
  timeout: 10000,
});

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

export interface PubChemSearchResult {
  cid: number;
  name: string;
  formula?: string;
  molecularWeight?: number;
}

export const pubchemService = {
  // Buscar por nombre con resultados detallados
  async searchByName(query: string): Promise<PubChemSearchResult[]> {
    try {
      if (query.length < 3) return [];

      // Primero buscar nombres que coincidan
      const nameResponse = await pubchemApi.get(
        `/compound/name/${encodeURIComponent(query)}/cids/JSON`
      );

      const cids = nameResponse.data?.IdentifierList?.CID;

      if (!cids || cids.length === 0) {
        return [];
      }

      // Obtener solo los primeros 5 resultados
      const topCids = cids.slice(0, 5);

      // Obtener nombres y propiedades básicas
      const detailsResponse = await pubchemApi.get(
        `/compound/cid/${topCids.join(',')}/property/IUPACName,MolecularFormula,MolecularWeight/JSON`
      );

      const properties = detailsResponse.data?.PropertyTable?.Properties || [];

      return properties.map((prop: any) => ({
        cid: prop.CID,
        name: prop.IUPACName || `Compound CID ${prop.CID}`,
        formula: prop.MolecularFormula || '',
        // Asegurar que molecularWeight sea número
        molecularWeight: prop.MolecularWeight ? parseFloat(prop.MolecularWeight) : undefined,
      }));

    } catch (error) {
      console.error('Error searching PubChem by name:', error);
      return [];
    }
  },

  // Búsqueda por nombre simple (versión original)
  async simpleSearchByName(name: string) {
    try {
      const response = await pubchemApi.get(`/compound/name/${encodeURIComponent(name)}/JSON`);
      return response.data;
    } catch (error) {
      console.error('Error searching PubChem by name:', error);
      return null;
    }
  },

  // Buscar por CAS (PubChem usa el nombre o CID)
  async searchByCAS(casNumber: string): Promise<PubChemSearchResult[]> {
    try {
      // PubChem no busca directamente por CAS, usamos el nombre
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
        molecularWeight: prop.MolecularWeight,
      }];

    } catch (error) {
      console.error('Error searching PubChem by CAS:', error);
      return [];
    }
  },

  // Obtener detalles completos por CID
  async getCompoundDetails(cid: number): Promise<PubChemData | null> {
    try {
      // Propiedades básicas
      const propsResponse = await pubchemApi.get(
        `/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,InChI,InChIKey,CanonicalSMILES/JSON`
      );

      const properties = propsResponse.data?.PropertyTable?.Properties?.[0];

      // Descripción de seguridad (simulada basada en estructura)
      // En un proyecto real, podrías mapear esto con datos reales

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

  // Obtener pictogramas GHS (simulados por ahora)
  async getGHSPictograms(casNumber: string): Promise<string[]> {
    // En producción, esto vendría de una API real
    // Por ahora, simulamos basado en el CAS
    const lastDigit = parseInt(casNumber.slice(-1)) || 0;

    if (lastDigit < 3) return ['GHS07']; // Irritante
    if (lastDigit < 6) return ['GHS06', 'GHS05']; // Tóxico + Corrosivo
    return ['GHS06', 'GHS08', 'GHS05']; // Muy tóxico + peligro salud + corrosivo
  },

  // Autocompletar datos de reactivo
  async enrichReagentData(name: string, casNumber?: string) {
    try {
      const searchResults = await this.searchByName(name);

      if (searchResults.length === 0) {
        return null;
      }

      const firstResult = searchResults[0];
      const details = await this.getCompoundDetails(firstResult.cid);

      if (!details) return null;

      // Obtener pictogramas
      const pictograms = await this.getGHSPictograms(casNumber || '');

      return {
        ...details,
        ghsPictograms: pictograms,
        searchResults, // Incluir resultados para vista previa
      };
    } catch (error) {
      console.error('Error enriching reagent data:', error);
      return null;
    }
  }
};
